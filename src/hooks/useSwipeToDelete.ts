import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react";

interface Options {
  onDelete: () => void;
  /** Furthest the row/card visually follows the finger, in px. */
  maxSwipe?: number;
  /** How far left (px) triggers delete on release. */
  threshold?: number;
}

/**
 * Horizontal swipe-left-to-delete gesture for a row or card. Tracks pointer
 * movement, decides horizontal-vs-vertical intent on the first few px (so it
 * never fights normal vertical list scrolling), and calls onDelete when
 * released past the threshold. Renders nothing — spread `handlers` onto the
 * swipeable element and translateX by `swipeX`.
 */
export function useSwipeToDelete({ onDelete, maxSwipe = 96, threshold = 80 }: Options) {
  const [swipeX, setSwipeX] = useState(0);
  const [swiping, setSwiping] = useState(false);
  const drag = useRef({ startX: 0, startY: 0, active: false, pointerId: null as number | null });
  const swipeXRef = useRef(0);
  /** True right after a real horizontal drag (even one that snapped back) —
   *  check this in onClick to swallow the spurious click a drag can leave
   *  behind, since a genuine tap never sets it. */
  const suppressClickRef = useRef(false);
  /** Some browsers/automation double-fire pointerup/pointercancel for one
   *  release. Rather than trust the first (which may fire mid-gesture) or
   *  block repeats (which may drop the real one), every end-of-gesture call
   *  reschedules this — only the last one in the burst actually finalizes,
   *  always against the freshest swipeXRef. */
  const finalizeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function onPointerDown(e: ReactPointerEvent) {
    suppressClickRef.current = false;
    if (finalizeTimer.current) {
      clearTimeout(finalizeTimer.current);
      finalizeTimer.current = null;
    }
    drag.current = { startX: e.clientX, startY: e.clientY, active: false, pointerId: e.pointerId };
  }

  function onPointerMove(e: ReactPointerEvent) {
    const d = drag.current;
    if (d.pointerId !== e.pointerId) return;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;

    if (!d.active) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      if (Math.abs(dy) >= Math.abs(dx)) {
        // Vertical intent — bail out, let the page scroll natively.
        d.pointerId = null;
        return;
      }
      d.active = true;
      setSwiping(true);
      try {
        (e.target as Element).setPointerCapture(e.pointerId);
      } catch {
        /* not supported — fine, gesture still works */
      }
    }

    if (e.cancelable) e.preventDefault();
    const next = Math.min(0, Math.max(-maxSwipe, dx));
    swipeXRef.current = next;
    setSwipeX(next);
  }

  function endGesture(e: ReactPointerEvent) {
    const d = drag.current;
    if (d.pointerId !== e.pointerId) return;

    if (!d.active) {
      // Never crossed the drag threshold — a plain tap, nothing to finalize.
      d.pointerId = null;
      return;
    }

    // Set synchronously — the browser's native "click" follows pointerup
    // immediately, well before any deferred finalize below would run, so the
    // suppression flag must already be true by then.
    suppressClickRef.current = true;

    try {
      (e.target as Element).releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }

    if (finalizeTimer.current) clearTimeout(finalizeTimer.current);
    finalizeTimer.current = setTimeout(() => {
      finalizeTimer.current = null;
      d.pointerId = null;
      d.active = false;
      setSwiping(false);
      if (swipeXRef.current <= -threshold) {
        onDelete();
      } else {
        setSwipeX(0);
      }
    }, 0);
  }

  return {
    swipeX,
    swiping,
    suppressClickRef,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp: endGesture,
      onPointerCancel: endGesture,
    },
  };
}
