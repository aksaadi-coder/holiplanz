import { useState } from "react";
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
  // completedStopIds only records "visited" — a stop's absence from it means
  // either "skipped" or "not decided yet", and those look identical from the
  // outside. Without this, every stop the user hasn't visited renders with
  // Skipped pre-highlighted, as if it were already their choice. Track what's
  // actually been decided this session so an untouched stop shows neither
  // button selected, leaving it to the user.
  const [decided, setDecided] = useState<Set<string>>(() => new Set(completedStopIds));

  if (!open) return null;

  const stops = itinerary.days.flatMap((day) => day.stops);

  function markDecided(stopId: string) {
    setDecided((prev) => (prev.has(stopId) ? prev : new Set(prev).add(stopId)));
  }

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
            const chosen = decided.has(stop.id);
            return (
              <div key={stop.id} className="hp-confirm-item">
                {/* A place name, which shouldn't be translated in the first
                    place. See Value in ui/primitives. */}
                <b translate="no">{stop.name}</b>
                <div className="hp-confirm-choices">
                  <button
                    type="button"
                    className={`hp-choice ${chosen && visited ? "is-on" : ""}`.trim()}
                    onClick={() => {
                      onToggle(stop.id, true);
                      markDecided(stop.id);
                    }}
                  >
                    Visited
                  </button>
                  <button
                    type="button"
                    className={`hp-choice ${chosen && !visited ? "is-on" : ""}`.trim()}
                    onClick={() => {
                      onToggle(stop.id, false);
                      markDecided(stop.id);
                    }}
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
