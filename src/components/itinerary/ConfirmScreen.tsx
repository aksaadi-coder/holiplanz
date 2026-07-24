import type { Itinerary } from "../../types";
import { cityName } from "../../utils/destination";
import { CloseCircle } from "../ui/primitives";

interface Props {
  open: boolean;
  itinerary: Itinerary;
  /** Stops the traveller marks as visited. */
  completedStopIds: Set<string>;
  onToggle: (stopId: string, visited: boolean) => void;
  onClose: () => void;
  onGeneratePassport: () => void;
}

/**
 * Post-trip "How was {city}?" review. Each stop is marked Visited or Skipped;
 * Visited feeds the trip's completed-stops set, which the Passport is built from.
 */
export function ConfirmScreen({
  open,
  itinerary,
  completedStopIds,
  onToggle,
  onClose,
  onGeneratePassport,
}: Props) {
  if (!open) return null;

  const stops = itinerary.days.flatMap((day) => day.stops);

  return (
    <div className="hp-fullscreen hp-confirm">
      <div className="hp-confirm-scroll">
        <div className="hp-confirm-head">
          <h1>How was {cityName(itinerary.destination)}?</h1>
          <CloseCircle onClose={onClose} label="Back to itinerary" />
        </div>
        <p className="hp-confirm-sub">
          Tell us what you actually did — we'll build your passport from it.
        </p>

        <div className="hp-confirm-list">
          {stops.map((stop) => {
            const visited = completedStopIds.has(stop.id);
            return (
              <div key={stop.id} className="hp-confirm-item">
                <b>{stop.name}</b>
                <div className="hp-confirm-choices">
                  <button
                    type="button"
                    className={`hp-choice ${visited ? "is-on" : ""}`.trim()}
                    onClick={() => onToggle(stop.id, true)}
                  >
                    Visited
                  </button>
                  <button
                    type="button"
                    className={`hp-choice ${!visited ? "is-on" : ""}`.trim()}
                    onClick={() => onToggle(stop.id, false)}
                  >
                    Skipped
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <p className="hp-confirm-note">Skipping is fine — the passport only counts what happened.</p>
      </div>

      <button type="button" className="hp-confirm-cta" onClick={onGeneratePassport}>
        Generate my trip passport →
      </button>
    </div>
  );
}
