import { useState } from "react";
import type { Itinerary } from "../types";
import type { SavedTrip } from "../hooks/useSavedTrips";
import { resolveBackground } from "../data/destinationBackgrounds";
import { formatDateRange } from "../utils/passport";
import { PassportScreen } from "./PassportScreen";

interface Props {
  itinerary: Itinerary | null;
  completedStopIds: Set<string>;
  savedTrips: SavedTrip[];
  /** Whether the active trip already has an earned passport (confirmed + generated). */
  isActiveSaved: boolean;
  /** Sends the active trip to "How was [city]?" so the user decides visited/skipped
   *  before a passport can be generated. */
  onOpenConfirm: () => void;
}

/**
 * Passport tab root — a list, not a single passport. The active trip shows as
 * a pending-passport banner until it's been confirmed (see ConfirmScreen);
 * only then does it behave like any other earned passport in the list below.
 */
export function PassportListScreen({
  itinerary,
  completedStopIds,
  savedTrips,
  isActiveSaved,
  onOpenConfirm,
}: Props) {
  const [openTrip, setOpenTrip] = useState<"active" | SavedTrip | null>(null);

  if (openTrip === "active" && itinerary) {
    return (
      <PassportScreen
        itinerary={itinerary}
        completedStopIds={completedStopIds}
        onBack={() => setOpenTrip(null)}
        backLabel="‹ Passports"
      />
    );
  }
  if (openTrip && openTrip !== "active") {
    return (
      <PassportScreen
        itinerary={openTrip.itinerary}
        completedStopIds={new Set(openTrip.completedStopIds ?? [])}
        onBack={() => setOpenTrip(null)}
        backLabel="‹ Passports"
      />
    );
  }

  // The active trip already lives in savedTrips once its passport is earned
  // (see App.handleShowPassport) — drop it from the list below so it isn't
  // shown twice.
  const pastTrips = savedTrips.filter((t) => t.itinerary.id !== itinerary?.id);
  const hasAny = Boolean(itinerary) || pastTrips.length > 0;

  return (
    <div className="hp-screen hp-trips">
      <div className="hp-trips-scroll">
        <h1 className="hp-display">Trip Passport</h1>

        {!hasAny && (
          <p className="hp-muted">Plan a trip and mark what you did — your stamps appear here.</p>
        )}

        {itinerary &&
          (isActiveSaved ? (
            <section className="hp-trips-section">
              <p className="hp-label">Current trip</p>
              <button type="button" className="hp-acct-trip-row" onClick={() => setOpenTrip("active")}>
                <img src={resolveBackground(itinerary.destination)} alt="" />
                <span className="hp-acct-trip-info">
                  <b>{itinerary.tripTitle}</b>
                  <span>
                    {formatDateRange(itinerary.startDate, itinerary.numDays) ?? "Dates tbc"} · passport earned
                  </span>
                </span>
                <span className="hp-acct-trip-chevron" aria-hidden>
                  ›
                </span>
              </button>
            </section>
          ) : (
            <button type="button" className="hp-trips-prep-banner" onClick={onOpenConfirm}>
              <span>
                Pending passport — confirm what you did on {itinerary.tripTitle} to generate it
              </span>
              <span aria-hidden>→</span>
            </button>
          ))}

        {pastTrips.length > 0 && (
          <section className="hp-trips-section">
            <p className="hp-label">Earned passports</p>
            <div className="hp-acct-trip-list">
              {pastTrips.map((trip) => (
                <button
                  key={trip.itinerary.id}
                  type="button"
                  className="hp-acct-trip-row"
                  onClick={() => setOpenTrip(trip)}
                >
                  <img src={resolveBackground(trip.itinerary.destination)} alt="" />
                  <span className="hp-acct-trip-info">
                    <b>{trip.itinerary.tripTitle}</b>
                    <span>
                      {formatDateRange(trip.itinerary.startDate, trip.itinerary.numDays) ?? "Dates tbc"} · passport
                      earned
                    </span>
                  </span>
                  <span className="hp-acct-trip-chevron" aria-hidden>
                    ›
                  </span>
                </button>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
