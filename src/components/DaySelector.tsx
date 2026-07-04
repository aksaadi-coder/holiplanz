import type { Day } from "../types";

interface Props {
  days: Day[];
  selectedDay: number | "all";
  onSelect: (day: number | "all") => void;
}

export function DaySelector({ days, selectedDay, onSelect }: Props) {
  return (
    <div className="day-selector">
      <button className={selectedDay === "all" ? "active" : ""} onClick={() => onSelect("all")}>
        All days
      </button>
      {days.map((day) => (
        <button
          key={day.dayNumber}
          className={selectedDay === day.dayNumber ? "active" : ""}
          onClick={() => onSelect(day.dayNumber)}
        >
          Day {day.dayNumber}
        </button>
      ))}
    </div>
  );
}
