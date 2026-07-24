import type { Itinerary, Stop } from "../../types";
import { MapView } from "../MapPanel/MapView";
import { CloseCircle } from "../ui/primitives";
import { cityName } from "../../utils/destination";

interface Props {
  open: boolean;
  itinerary: Itinerary;
  selectedDay: number;
  onSelectDay: (day: number) => void;
  onOpenStop: (stop: Stop) => void;
  onClose: () => void;
  completedStopIds: Set<string>;
}

/**
 * Full-screen "Map view". The design mocks an abstract map; we render the real
 * Leaflet map in that area, keeping the design's header, day chips and hint.
 */
export function MapScreen({
  open,
  itinerary,
  selectedDay,
  onSelectDay,
  onOpenStop,
  onClose,
  completedStopIds,
}: Props) {
  if (!open) return null;

  const shortName = cityName(itinerary.destination);

  return (
    <div className="hp-fullscreen hp-mapscreen">
      <div className="hp-mapscreen-top">
        <div className="hp-mapscreen-head">
          <b>{shortName} · map</b>
          <CloseCircle onClose={onClose} label="Back to itinerary" />
        </div>
        <div className="hp-itin-days">
          {itinerary.days.map((d) => (
            <button
              key={d.dayNumber}
              type="button"
              className={`hp-chip ${d.dayNumber === selectedDay ? "is-selected" : ""}`.trim()}
              onClick={() => onSelectDay(d.dayNumber)}
            >
              Day {d.dayNumber}
            </button>
          ))}
        </div>
      </div>

      <div className="hp-mapscreen-body">
        <MapView
          itinerary={itinerary}
          selectedDay={selectedDay}
          highlightedStopId={null}
          flyToStop={null}
          fitSignal={selectedDay}
          onStopClick={(id) => {
            const stop = itinerary.days
              .flatMap((d) => d.stops)
              .find((s) => s.id === id);
            if (stop) onOpenStop(stop);
          }}
          selectedStopId={null}
          placeInfo={null}
          placeInfoLoading={false}
          onCloseDetail={() => {}}
          selectedAccommodationOptionId={null}
          onAccommodationOptionClick={() => {}}
          onConfirmAccommodationOption={() => {}}
          completedStopIds={completedStopIds}
        />
        <span className="hp-mapscreen-hint">Tap a stop for details</span>
      </div>
    </div>
  );
}
