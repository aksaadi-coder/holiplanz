import type { Itinerary } from "../../types";
import { DayCard } from "./DayCard";

function noop() {}

export function PrintItinerary({ itinerary }: { itinerary: Itinerary }) {
  return (
    <div className="print-itinerary">
      {itinerary.days.map((day) => (
        <DayCard
          key={day.dayNumber}
          day={day}
          itinerary={itinerary}
          highlightedStopId={null}
          onHover={noop}
          onClick={noop}
          showPrintMap
        />
      ))}
    </div>
  );
}
