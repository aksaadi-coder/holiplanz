import type { SavedTrip } from "../../hooks/useSavedTrips";
import { resolveBackground } from "../../data/destinationBackgrounds";
import { formatDateRange, stableNumber } from "../../utils/passport";

interface Props {
  savedTrips: SavedTrip[];
  onBack: () => void;
  onOpenTrip: (trip: SavedTrip) => void;
}

function yearOf(trip: SavedTrip): number {
  const raw = trip.itinerary.startDate ?? trip.savedAt;
  const year = new Date(raw).getFullYear();
  return Number.isFinite(year) ? year : new Date(trip.savedAt).getFullYear();
}

/** Full "Past trips" list, grouped by year — see AccountScreen for the preview version. */
export function PastTripsScreen({ savedTrips, onBack, onOpenTrip }: Props) {
  const sorted = [...savedTrips].sort((a, b) => yearOf(b) - yearOf(a));
  const groups = new Map<number, SavedTrip[]>();
  for (const trip of sorted) {
    const year = yearOf(trip);
    if (!groups.has(year)) groups.set(year, []);
    groups.get(year)!.push(trip);
  }

  return (
    <div className="hp-fullscreen hp-acct-sub">
      <div className="hp-acct-sub-scroll">
        <button type="button" className="hp-back-link" onClick={onBack}>
          ‹ Account
        </button>
        <h1>Past trips</h1>

        {groups.size === 0 && (
          <p className="hp-muted">Finish a trip to start collecting passports here.</p>
        )}

        {[...groups.entries()].map(([year, trips]) => (
          <div key={year}>
            <p className="hp-label">{year}</p>
            <div className="hp-acct-trip-list">
              {trips.map((trip) => (
                <button
                  type="button"
                  key={trip.itinerary.id}
                  className="hp-acct-trip-row"
                  onClick={() => onOpenTrip(trip)}
                >
                  <img src={resolveBackground(trip.itinerary.destination)} alt="" />
                  <span className="hp-acct-trip-info">
                    <b>{trip.itinerary.tripTitle}</b>
                    <span>
                      {formatDateRange(trip.itinerary.startDate, trip.itinerary.numDays) ?? "Dates tbc"}
                      {" · passport "}
                      {stableNumber(trip.itinerary.id)}
                    </span>
                  </span>
                  <span className="hp-acct-trip-chevron">›</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
