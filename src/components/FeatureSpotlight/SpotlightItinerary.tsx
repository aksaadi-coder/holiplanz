import { useEffect, useState } from "react";
import { SAMPLE_TRIP } from "../../data/sampleTrip";

const STAGGER_MS = 220;

// "Generation replay": the sample plan's days and stops cascade in one by one,
// as if the itinerary is being written in front of you.
export function SpotlightItinerary() {
  const items = SAMPLE_TRIP.days.flatMap((day) => [
    { kind: "day" as const, day },
    ...day.stops.map((stop, i) => ({ kind: "stop" as const, day, stop, index: i })),
  ]);
  const totalMs = items.length * STAGGER_MS + 500;
  const [done, setDone] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => setDone(true), totalMs);
    return () => clearTimeout(id);
  }, [totalMs]);

  return (
    <div className="spotlight-itinerary">
      <p className={done ? "spotlight-status done" : "spotlight-status"}>
        {done ? (
          <>✓ Lisbon in 3 days — planned in seconds</>
        ) : (
          <>
            Crafting your Lisbon itinerary
            <span className="spotlight-ellipsis" aria-hidden="true" />
          </>
        )}
      </p>
      <div className="spotlight-scroll">
        {items.map((item, i) => {
          const style = { "--spotlight-i": i } as React.CSSProperties;
          if (item.kind === "day") {
            return (
              <div className="spotlight-reveal spotlight-day-heading" style={style} key={`day-${item.day.dayNumber}`}>
                <span className="spotlight-day-number">Day {item.day.dayNumber}</span>
                <div>
                  <strong>{item.day.title}</strong>
                  <p>{item.day.summary}</p>
                </div>
              </div>
            );
          }
          return (
            <div className="spotlight-reveal" style={style} key={item.stop.id}>
              <div className="stop-card spotlight-stop">
                <div className="stop-number">{item.index + 1}</div>
                <div className="stop-body">
                  <div className="stop-header">
                    <div className="stop-header-text">
                      <strong>{item.stop.name}</strong>
                      <span className="stop-time">{item.stop.timeOfDay}</span>
                    </div>
                  </div>
                  <p>{item.stop.description}</p>
                  <div className="stop-tags">
                    <span className="tag">{item.stop.category}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
