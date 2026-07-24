import { useEffect, useRef, useState, type MouseEvent as ReactMouseEvent } from "react";

interface Options {
  open: boolean;
  frameCount: number;
  frameMs?: number;
  onClose: () => void;
}

/**
 * Drives a story-style reel: the current frame index, this frame's fill
 * progress (0-1), and tap-to-step navigation (tap left third = back, right
 * two-thirds = forward). Auto-advances on a timer and closes itself after
 * the last frame; resets to frame 0 every time it opens. Timers clean up on
 * unmount/frame change/close.
 */
export function useReel({ open, frameCount, frameMs = 3600, onClose }: Options) {
  const [frame, setFrame] = useState(0);
  const [progress, setProgress] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (open) setFrame(0);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const start = performance.now();
    setProgress(0);

    function tick(now: number) {
      const pct = Math.min(1, (now - start) / frameMs);
      setProgress(pct);
      if (pct >= 1) {
        if (frame < frameCount - 1) setFrame((f) => f + 1);
        else onClose();
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // frameMs/onClose intentionally excluded — re-running this effect only on
    // open/frame changes is what makes each frame's timer independent.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, frame, frameCount]);

  function goTo(next: number) {
    setFrame(Math.max(0, Math.min(frameCount - 1, next)));
  }

  function handleTap(e: ReactMouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    goTo(x < rect.width / 3 ? frame - 1 : frame + 1);
  }

  return { frame, progress, handleTap };
}
