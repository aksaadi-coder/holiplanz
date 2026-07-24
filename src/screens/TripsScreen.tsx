import { useState } from "react";
import type { Itinerary } from "../types";
import type { SavedTrip } from "../hooks/useSavedTrips";
import { useSwipeToDelete } from "../hooks/useSwipeToDelete";
import { resolveBackground } from "../data/destinationBackgrounds";
import { dayLabel, startsInLabel } from "../utils/destination";
import { formatDateRange, tripRoute } from "../utils/passport";
import { TrashIcon } from "../components/ui/icons";
import { PassportScreen } from "./PassportScreen";

interface Props {
  itinerary: Itinerary | null;
  savedTrips: SavedTrip[];
  onOpenActive: () => void;
  onDeleteActive: () => void;
  onDeleteSaved: (tripId: string) => void;
  tripUndoMessage: string | null;
  onUndoDelete: () => void;
}

/** "Coming up" hero card — photo up top, title + dates/route below, with a
 *  countdown pill. Swipe left to remove the active trip (see useSwipeToDelete
 *  and handleDeleteActiveTrip's undo, owned by App). */
function ActiveTripCard({
  itinerary,
  onOpen,
  onDelete,
}: {
  itinerary: Itinerary;
  onOpen: () => void;
  onDelete: () => void;
}) {
  const { swipeX, swiping, suppressClickRef, handlers } = useSwipeToDelete({ onDelete });
  const meta = [
    formatDateRange(itinerary.startDate, itinerary.numDays),
    dayLabel(itinerary.numDays),
    tripRoute(itinerary).join(" → "),
  ]
    .filter(Boolean)
    .join(" · ");
  const countdown = startsInLabel(itinerary.startDate);

  return (
    <div className="hp-swipe-wrap hp-trips-hero-wrap">
      <div className="hp-swipe-remove-bg" aria-hidden="true">
        <TrashIcon size={18} />
        Remove
      </div>
      <button
        type="button"
        className="hp-trips-hero"
        style={{
          transform: `translateX(${swipeX}px)`,
          transition: swiping ? "none" : "transform 0.2s ease",
          touchAction: "pan-y",
        }}
        onClick={() => {
          if (!suppressClickRef.current) onOpen();
        }}
        {...handlers}
      >
        <img src={resolveBackground(itinerary.destination)} alt="" className="hp-trips-hero-photo" />
        <span className="hp-trips-hero-body">
          <b>{itinerary.tripTitle}</b>
          <span className="hp-trips-hero-meta">{meta}</span>
          {countdown && <span className="hp-trips-countdown">{countdown}</span>}
        </span>
      </button>
    </div>
  );
}

/** Swipe left to remove a finished trip (see useSwipeToDelete and
 *  handleDeleteSavedTrip's undo, owned by App). */
function FinishedTripRow({
  trip,
  onOpen,
  onDelete,
}: {
  trip: SavedTrip;
  onOpen: () => void;
  onDelete: () => void;
}) {
  const { swipeX, swiping, suppressClickRef, handlers } = useSwipeToDelete({ onDelete });

  return (
    <div className="hp-swipe-wrap hp-acct-trip-row-wrap">
      <div className="hp-swipe-remove-bg" aria-hidden="true">
        <TrashIcon size={18} />
        Remove
      </div>
      <button
        type="button"
        className="hp-acct-trip-row"
        style={{
          transform: `translateX(${swipeX}px)`,
          transition: swiping ? "none" : "transform 0.2s ease",
          touchAction: "pan-y",
        }}
        onClick={() => {
          if (!suppressClickRef.current) onOpen();
        }}
        {...handlers}
      >
        <img src={resolveBackground(trip.itinerary.destination)} alt="" />
        <span className="hp-acct-trip-info">
          <b>{trip.itinerary.tripTitle}</b>
          <span>{formatDateRange(trip.itinerary.startDate, trip.itinerary.numDays) ?? "Dates tbc"} · passport earned</span>
        </span>
        <span className="hp-acct-trip-chevron" aria-hidden>
          ›
        </span>
      </button>
    </div>
  );
}

/** Trips tab root — "Coming up" (the active trip) and "Finished" (saved/
 *  passport-earned trips), matching the Account tab's past-trips row style. */
export function TripsScreen({
  itinerary,
  savedTrips,
  onOpenActive,
  onDeleteActive,
  onDeleteSaved,
  tripUndoMessage,
  onUndoDelete,
}: Props) {
  const [openTrip, setOpenTrip] = useState<SavedTrip | null>(null);

  if (openTrip) {
    return (
      <PassportScreen
        itinerary={openTrip.itinerary}
        completedStopIds={new Set(openTrip.completedStopIds ?? [])}
        onBack={() => setOpenTrip(null)}
        backLabel="‹ Your trips"
      />
    );
  }

  const hasAny = Boolean(itinerary) || savedTrips.length > 0;

  return (
    <div className="hp-screen hp-trips">
      <div className="hp-trips-scroll">
        <h1 className="hp-display">Your trips</h1>

        {!hasAny && <p className="hp-muted">No trips yet — plan one from Home.</p>}

        {itinerary && (
          <section className="hp-trips-section">
            <p className="hp-label">Coming up</p>
            <ActiveTripCard itinerary={itinerary} onOpen={onOpenActive} onDelete={onDeleteActive} />
          </section>
        )}

        {savedTrips.length > 0 && (
          <section className="hp-trips-section">
            <p className="hp-label">Finished</p>
            <div className="hp-acct-trip-list">
              {savedTrips.map((trip) => (
                <FinishedTripRow
                  key={trip.itinerary.id}
                  trip={trip}
                  onOpen={() => setOpenTrip(trip)}
                  onDelete={() => onDeleteSaved(trip.itinerary.id)}
                />
              ))}
            </div>
          </section>
        )}
      </div>

      {tripUndoMessage && (
        <div className="hp-undo" role="status">
          <span>{tripUndoMessage}</span>
          <button type="button" onClick={onUndoDelete}>
            Undo
          </button>
        </div>
      )}
    </div>
  );
}
