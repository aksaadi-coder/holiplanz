import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react";

/** How far a row slides left to expose its Delete button, in px. Exported so
 *  the button can be sized from the same number the gesture uses. */
export const REVEAL_WIDTH = 112;

/** Past this much drag, the release settles open rather than closed — half the
 *  reveal, so the same rule opens a closed row and closes an open one. */
const SETTLE_THRESHOLD = REVEAL_WIDTH / 2;

/** How far a finger travels before we decide the gesture is a horizontal
 *  swipe rather than the start of a vertical scroll. */
const INTENT_SLOP = 8;

interface Options {
  /** Whether this row is showing its Delete button. Owned by the list rather
   *  than the row, so opening one row closes any other. */
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Ignore the gesture entirely — used while a drag-to-reorder is in flight. */
  disabled?: boolean;
}

/**
 * Swipe a row left to reveal a Delete button. The swipe never deletes on its
 * own: it moves the row aside and stops there, and the deletion needs a
 * deliberate press on the button that appears. A swipe is easy to make by
 * accident while scrolling a list with a thumb, and undo is a worse answer
 * than not destroying anything in the first place.
 *
 * Renders nothing — spread `handlers` onto the row and translateX by `offset`.
 * The open/closed state lives with the caller so that the resting position is
 * always derived from it, never a second copy that could drift.
 */
export function useSwipeToReveal({ open, onOpenChange, disabled = false }: Options) {
  /** Set only while a finger is actually moving the row; null the rest of the
   *  time, so `open` alone decides where the row sits. */
  const [dragOffset, setDragOffset] = useState<number | null>(null);
  const drag = useRef({
    startX: 0,
    startY: 0,
    from: 0,
    active: false,
    pointerId: null as number | null,
  });
  /** The freshest offset, for the release — a state read there could still be
   *  a render behind the last move. */
  const offsetRef = useRef(0);
  /** Set by a real swipe (even one that snapped back), to swallow the click
   *  the browser fires on release. A genuine tap never sets it. */
  const suppressClickRef = useRef(false);

  const restOffset = open ? -REVEAL_WIDTH : 0;
  const offset = dragOffset ?? restOffset;
  offsetRef.current = offset;

  function onPointerDown(e: ReactPointerEvent) {
    if (disabled) return;
    suppressClickRef.current = false;
    drag.current = {
      startX: e.clientX,
      startY: e.clientY,
      // An already-open row carries on from where it sits, so a second swipe
      // pushes it further or drags it back rather than jumping.
      from: restOffset,
      active: false,
      pointerId: e.pointerId,
    };
  }

  function onPointerMove(e: ReactPointerEvent) {
    const d = drag.current;
    if (disabled || d.pointerId !== e.pointerId) return;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;

    if (!d.active) {
      if (Math.abs(dx) < INTENT_SLOP && Math.abs(dy) < INTENT_SLOP) return;
      if (Math.abs(dy) >= Math.abs(dx)) {
        // Vertical intent — bail out, let the page scroll natively.
        d.pointerId = null;
        return;
      }
      d.active = true;
      try {
        (e.target as Element).setPointerCapture(e.pointerId);
      } catch {
        /* not supported — fine, gesture still works */
      }
    }

    if (e.cancelable) e.preventDefault();
    setDragOffset(Math.min(0, Math.max(-REVEAL_WIDTH, d.from + dx)));
  }

  function endGesture(e: ReactPointerEvent) {
    const d = drag.current;
    if (d.pointerId !== e.pointerId) return;
    d.pointerId = null;

    if (!d.active) return; // Never crossed the slop — a plain tap.
    d.active = false;

    // Set synchronously: the browser's native click follows pointerup
    // immediately, so the flag has to be true by then.
    suppressClickRef.current = true;
    try {
      (e.target as Element).releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }

    const settled = offsetRef.current <= -SETTLE_THRESHOLD;
    setDragOffset(null);
    onOpenChange(settled);
  }

  /**
   * Whether this click is the phantom one the browser fires at the end of a
   * swipe, rather than a tap. Consuming the flag matters now that a swipe
   * leaves the row sitting open: the very next real tap is how the row is put
   * away again, and a flag left standing would eat it.
   */
  function shouldIgnoreClick() {
    if (!suppressClickRef.current) return false;
    suppressClickRef.current = false;
    return true;
  }

  return {
    offset,
    /** True mid-gesture — the row should follow the finger without easing. */
    swiping: dragOffset !== null,
    shouldIgnoreClick,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp: endGesture,
      onPointerCancel: endGesture,
    },
  };
}
