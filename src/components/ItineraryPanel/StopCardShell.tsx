import { useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent, MouseEvent as ReactMouseEvent, ReactNode } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Stop } from "../../types";

const SWIPE_ENGAGE_PX = 14;
const SWIPE_DELETE_PX = 96;

interface Props {
  stop: Stop;
  onDelete: () => void;
  children: ReactNode;
}

// Wraps a StopCard with the two edit gestures:
// - hold ~300ms then drag to reorder (dnd-kit sortable; mouse drags need 8px movement)
// - swipe left (touch only) to reveal a delete zone; past the threshold, release deletes
export function StopCardShell({ stop, onDelete, children }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: stop.id,
  });
  const [swipeX, setSwipeX] = useState(0);
  const [removing, setRemoving] = useState(false);
  const swipeRef = useRef<{ startX: number; startY: number; engaged: boolean } | null>(null);
  const suppressClickRef = useRef(false);

  function handlePointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    suppressClickRef.current = false;
    if (e.pointerType !== "touch" || isDragging || removing) return;
    swipeRef.current = { startX: e.clientX, startY: e.clientY, engaged: false };
  }

  function handlePointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    const swipe = swipeRef.current;
    if (!swipe || removing) return;
    if (isDragging) {
      swipeRef.current = null;
      setSwipeX(0);
      return;
    }
    const dx = e.clientX - swipe.startX;
    const dy = e.clientY - swipe.startY;
    if (!swipe.engaged) {
      if (Math.abs(dy) > Math.abs(dx)) {
        // vertical intent: it's a scroll, stop tracking
        swipeRef.current = null;
        return;
      }
      if (dx > 0 || Math.abs(dx) < SWIPE_ENGAGE_PX) return;
      swipe.engaged = true;
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        // pointer may no longer be active (e.g. synthetic events); tracking still works
      }
    }
    setSwipeX(Math.min(0, dx));
  }

  function handlePointerEnd(e: ReactPointerEvent<HTMLDivElement>) {
    const swipe = swipeRef.current;
    swipeRef.current = null;
    if (!swipe?.engaged) return;
    suppressClickRef.current = true;
    if (e.type !== "pointercancel" && swipeX < -SWIPE_DELETE_PX) {
      setRemoving(true);
      setSwipeX(-window.innerWidth);
      setTimeout(onDelete, 180);
    } else {
      setSwipeX(0);
    }
  }

  function handleClickCapture(e: ReactMouseEvent<HTMLDivElement>) {
    if (suppressClickRef.current) {
      e.preventDefault();
      e.stopPropagation();
      suppressClickRef.current = false;
    }
  }

  // A completed drag fires a click on release; swallow it so the card doesn't expand.
  if (isDragging) suppressClickRef.current = true;

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      className={`stop-shell${isDragging ? " stop-shell-dragging" : ""}${removing ? " stop-shell-removing" : ""}`}
      style={style}
      {...attributes}
      {...listeners}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerEnd}
      onPointerCancel={handlePointerEnd}
      onClickCapture={handleClickCapture}
    >
      <div className="stop-swipe-backdrop" aria-hidden="true">
        <span>Delete</span>
      </div>
      <div
        className={`stop-shell-inner${swipeRef.current?.engaged ? "" : " stop-shell-settle"}`}
        style={{ transform: swipeX ? `translateX(${swipeX}px)` : undefined }}
      >
        {children}
      </div>
    </div>
  );
}
