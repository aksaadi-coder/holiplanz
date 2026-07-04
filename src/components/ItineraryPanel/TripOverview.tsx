import type { Itinerary } from "../../types";

const MAX_HIGHLIGHTS = 3;

interface Props {
  itinerary: Itinerary;
  onSelectDay: (day: number) => void;
}

export function TripOverview({ itinerary, onSelectDay }: Props) {
  return (
    <div className="trip-overview">
      {itinerary.days.map((day) => {
        const highlights = day.stops.slice(0, MAX_HIGHLIGHTS);
        const extra = day.stops.length - highlights.length;
        return (
          <div className="overview-card" key={day.dayNumber} onClick={() => onSelectDay(day.dayNumber)}>
            <div className="overview-card-header">
              <span className="overview-day-badge">Day {day.dayNumber}</span>
              <strong>{day.title}</strong>
            </div>
            <p className="overview-summary">{day.summary}</p>
            <div className="overview-highlights">
              {highlights.map((stop) => (
                <span className="highlight-chip" key={stop.id}>
                  {stop.name}
                </span>
              ))}
              {extra > 0 && <span className="highlight-more">+{extra} more</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
