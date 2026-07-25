import { useState } from "react";
import type { Itinerary } from "../types";
import type { SavedTrip } from "../hooks/useSavedTrips";
import { useSwipeToDelete } from "../hooks/useSwipeToDelete";
import { resolveBackground } from "../data/destinationBackgrounds";
import { CHECKLIST_ITEMS } from "../data/checklistItems";
import { cityName, dayLabel, daysUntilTrip, isDuringTrip, isTripOver, startsInLabel } from "../utils/destination";
import { getNextUp } from "../utils/schedule";
import { formatDateRange, tripRoute } from "../utils/passport";
import { TrashIcon, ChevronRightIcon } from "../components/ui/icons";
import { PassportScreen } from "./PassportScreen";
import { ChecklistScreen } from "../components/itinerary/ChecklistScreen";

interface Props {
  itinerary: Itinerary | null;
  savedTrips: SavedTrip[];
  checklistDone: Set<string>;
  onToggleChecklistItem: (itemId: string) => void;
  /** Visited stops — used to find what's happening next once the trip is underway. */
  completedStopIds: Set<string>;
  /** Account "notify me about upcoming trips" preference — gates the prep banner. */
  notifyTrip: boolean;
  onOpenActive: () => void;
  onDeleteActive: () => void;
  onDeleteSaved: (tripId: string) => void;
  tripUndoMessage: string | null;
  onUndoDelete: () => void;
}

/** How many days out the "prep reminder" banner starts showing. */
const PREP_REMINDER_WINDOW_DAYS = 3;

/** "Coming up" hero card — photo up top, title + dates/route below, with a
 *  countdown pill. Swipe left to remove the active trip (see useSwipeToDelete
 *  and handleDeleteActiveTrip's undo, owned by App). */
function ActiveTripCard({
  itinerary,
  completedStopIds,
  onOpen,
  onDelete,
}: {
  itinerary: Itinerary;
  completedStopIds: Set<string>;
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
  const duringTrip = isDuringTrip(itinerary.startDate, itinerary.numDays);
  const tripOver = isTripOver(itinerary.startDate, itinerary.numDays);
  const nextUp = duringTrip ? getNextUp(itinerary, completedStopIds) : null;

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
      {duringTrip && nextUp && (
        <button
          type="button"
          className="hp-trips-prep-row"
          onClick={(e) => {
            e.stopPropagation();
            onOpen();
          }}
        >
          <span>
            <span className="hp-label">Happening next{nextUp.time ? ` · ${nextUp.time}` : ""}</span>
            <strong>{nextUp.stop.name}</strong>
          </span>
          <ChevronRightIcon size={18} />
        </button>
      )}

      {tripOver && (
        <button
          type="button"
          className="hp-trips-prep-row"
          onClick={(e) => {
            e.stopPropagation();
            onOpen();
          }}
        >
          <span>
            <span className="hp-label">Trip over</span>
            <strong>Generate your passport</strong>
          </span>
          <ChevronRightIcon size={18} />
        </button>
      )}
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
  checklistDone,
  onToggleChecklistItem,
  completedStopIds,
  notifyTrip,
  onOpenActive,
  onDeleteActive,
  onDeleteSaved,
  tripUndoMessage,
  onUndoDelete,
}: Props) {
  const [openTrip, setOpenTrip] = useState<SavedTrip | null>(null);
  const [checklistOpen, setChecklistOpen] = useState(false);

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

  const daysOut = itinerary ? daysUntilTrip(itinerary.startDate) : null;
  const prepRemaining = itinerary
    ? CHECKLIST_ITEMS.length - CHECKLIST_ITEMS.filter((item) => checklistDone.has(item.id)).length
    : 0;
  const showPrepBanner =
    notifyTrip &&
    itinerary &&
    !isDuringTrip(itinerary.startDate, itinerary.numDays) &&
    daysOut !== null &&
    daysOut >= 0 &&
    daysOut <= PREP_REMINDER_WINDOW_DAYS &&
    prepRemaining > 0;

  return (
    <div className="hp-screen hp-trips">
      <div className="hp-trips-scroll">
        <h1 className="hp-display">Your trips</h1>

        {!hasAny && <p className="hp-muted">No trips yet — plan one from Home.</p>}

        {showPrepBanner && itinerary && (
          <button type="button" className="hp-trips-prep-banner" onClick={() => setChecklistOpen(true)}>
            <span>
              {daysOut === 0
                ? `Your ${cityName(itinerary.destination)} trip starts today`
                : `Your ${cityName(itinerary.destination)} trip starts in ${daysOut} day${daysOut === 1 ? "" : "s"}`}
              {" — "}
              {prepRemaining} thing{prepRemaining === 1 ? "" : "s"} left to prepare
            </span>
            <span aria-hidden>→</span>
          </button>
        )}

        {itinerary && (
          <section className="hp-trips-section">
            <p className="hp-label">Coming up</p>
            <ActiveTripCard
              itinerary={itinerary}
              completedStopIds={completedStopIds}
              onOpen={onOpenActive}
              onDelete={onDeleteActive}
            />
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

      <ChecklistScreen
        open={checklistOpen}
        checklistDone={checklistDone}
        onToggle={onToggleChecklistItem}
        onClose={() => setChecklistOpen(false)}
        backLabel="‹ Your trips"
      />
    </div>
  );
}
