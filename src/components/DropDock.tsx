import { useDroppable } from "@dnd-kit/core";
import type { Day } from "../types";

export const DOCK_PREFIX = "dock-day-";

function DockChip({ day, disabled }: { day: Day; disabled: boolean }) {
  const { setNodeRef, isOver } = useDroppable({ id: `${DOCK_PREFIX}${day.dayNumber}`, disabled });
  return (
    <div
      ref={setNodeRef}
      className={`drop-dock-chip${disabled ? " current" : ""}${isOver && !disabled ? " over" : ""}`}
    >
      Day {day.dayNumber}
    </div>
  );
}

// Floating drop targets shown only while a stop card is being dragged, so a
// card can be moved to another day even when the day tabs are scrolled away.
export function DropDock({ days, currentDay }: { days: Day[]; currentDay: number | "all" }) {
  return (
    <div className="drop-dock">
      <span className="drop-dock-label">Move to</span>
      <div className="drop-dock-chips">
        {days.map((day) => (
          <DockChip key={day.dayNumber} day={day} disabled={day.dayNumber === currentDay} />
        ))}
      </div>
    </div>
  );
}
