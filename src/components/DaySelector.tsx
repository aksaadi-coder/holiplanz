import { useDroppable } from "@dnd-kit/core";
import type { Day } from "../types";

interface Props {
  days: Day[];
  selectedDay: number | "all";
  onSelect: (day: number | "all") => void;
  dragActive?: boolean;
}

export const DAY_TAB_PREFIX = "day-tab-";

function DayTab({
  day,
  active,
  droppable,
  onSelect,
}: {
  day: Day;
  active: boolean;
  droppable: boolean;
  onSelect: () => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `${DAY_TAB_PREFIX}${day.dayNumber}`,
    disabled: !droppable,
  });
  const classes = [
    active ? "active" : "",
    droppable ? "drop-ready" : "",
    droppable && isOver ? "drop-over" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button ref={setNodeRef} className={classes} onClick={onSelect}>
      Day {day.dayNumber}
    </button>
  );
}

export function DaySelector({ days, selectedDay, onSelect, dragActive = false }: Props) {
  return (
    <div className="day-selector">
      <button className={selectedDay === "all" ? "active" : ""} onClick={() => onSelect("all")}>
        All days
      </button>
      {days.map((day) => (
        <DayTab
          key={day.dayNumber}
          day={day}
          active={selectedDay === day.dayNumber}
          droppable={dragActive && selectedDay !== day.dayNumber}
          onSelect={() => onSelect(day.dayNumber)}
        />
      ))}
    </div>
  );
}
