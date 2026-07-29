import { useState } from "react";
import type { Itinerary } from "../types";
import type { SavedTrip } from "../hooks/useSavedTrips";
import { useSwipeToReveal } from "../hooks/useSwipeToReveal";
import { resolveBackground } from "../data/destinationBackgrounds";
import { CHECKLIST_ITEMS } from "../data/checklistItems";
import { cityName, dayLabel, daysUntilTrip, isDuringTrip, isTripOver, startsInLabel } from "../utils/destination";
import { getNextUp } from "../utils/schedule";
import { formatDateRange, tripRoute } from "../utils/passport";
import { ChevronRightIcon } from "../components/ui/icons";
import { SwipeDeleteButton, Value } from "../components/ui/primitives";
import type { Membership } from "../hooks/useMembership";
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
  /** Account "trip wrap-up reminders" preference — gates the "trip over" nudge. */
  notifyWrapUp: boolean;
  onOpenActive: () => void;
  /** Opens the itinerary straight to the Confirm sheet, for the "Trip over" nudge. */
  onOpenConfirm: () => void;
  onDeleteActive: () => void;
  onDeleteSaved: (tripId: string) => void;
  tripUndoMessage: string | null;
  onUndoDelete: () => void;
  membership: Membership;
}

/** How many days out the "prep reminder" banner starts showing. */
const PREP_REMINDER_WINDOW_DAYS = 3;

/** "Coming up" hero card — photo up top, title + dates/route below, with a
 *  countdown pill. Swipe left to uncover Delete (see useSwipeToReveal and
 *  handleDeleteActiveTrip's undo, owned by App). */
function ActiveTripCard({
  itinerary,
  completedStopIds,
  notifyWrapUp,
  swipedOpen,
  onSwipedOpenChange,
  onOpen,
  onOpenConfirm,
  onDelete,
}: {
  itinerary: Itinerary;
  completedStopIds: Set<string>;
  notifyWrapUp: boolean;
  swipedOpen: boolean;
  onSwipedOpenChange: (open: boolean) => void;
  onOpen: () => void;
  onOpenConfirm: () => void;
  onDelete: () => void;
}) {
  const { offset, swiping, shouldIgnoreClick, handlers } = useSwipeToReveal({
    open: swipedOpen,
    onOpenChange: onSwipedOpenChange,
  });
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
    /* The wrap holds only the hero card, so the Delete button behind it is the
       height of the card and not of the prep rows that follow. */
    <>
      <div className={`hp-swipe-wrap hp-trips-hero-wrap ${swipedOpen ? "is-open" : ""}`.trim()}>
        <SwipeDeleteButton
          open={swipedOpen}
          onDelete={onDelete}
          label={`Delete ${itinerary.tripTitle}`}
        />
        <button
          type="button"
          className="hp-trips-hero"
          style={{
            transform: `translateX(${offset}px)`,
            transition: swiping ? "none" : "transform 0.2s ease",
            touchAction: "pan-y",
          }}
          onClick={() => {
            if (shouldIgnoreClick()) return;
            if (swipedOpen) {
              onSwipedOpenChange(false);
              return;
            }
            onOpen();
          }}
          {...handlers}
        >
          <img
            src={resolveBackground(itinerary.destination)}
            alt=""
            className="hp-trips-hero-photo"
          />
          <span className="hp-trips-hero-body">
            <b>{itinerary.tripTitle}</b>
            {/* Dates, day count and route in one string; the countdown carries
                a number too. Both change as the trip is edited or the date
                nears. See Value in ui/primitives. */}
            <span className="hp-trips-hero-meta" translate="no">
              {meta}
            </span>
            {countdown && (
              <span className="hp-trips-countdown" translate="no">
                {countdown}
              </span>
            )}
          </span>
        </button>
      </div>

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
            <span className="hp-label">
              Happening next<Value>{nextUp.time ? ` · ${nextUp.time}` : ""}</Value>
            </span>
            <strong translate="no">{nextUp.stop.name}</strong>
          </span>
          <ChevronRightIcon size={18} />
        </button>
      )}

      {tripOver && notifyWrapUp && (
        <button
          type="button"
          className="hp-trips-prep-row"
          onClick={(e) => {
            e.stopPropagation();
            onOpenConfirm();
          }}
        >
          <span>
            <span className="hp-label">Trip over</span>
            <strong>Generate your passport</strong>
          </span>
          <ChevronRightIcon size={18} />
        </button>
      )}
    </>
  );
}

/** Swipe left to uncover Delete on a finished trip (see useSwipeToReveal and
 *  handleDeleteSavedTrip's undo, owned by App). */
function FinishedTripRow({
  trip,
  swipedOpen,
  onSwipedOpenChange,
  onOpen,
  onDelete,
}: {
  trip: SavedTrip;
  swipedOpen: boolean;
  onSwipedOpenChange: (open: boolean) => void;
  onOpen: () => void;
  onDelete: () => void;
}) {
  const { offset, swiping, shouldIgnoreClick, handlers } = useSwipeToReveal({
    open: swipedOpen,
    onOpenChange: onSwipedOpenChange,
  });

  return (
    <div className={`hp-swipe-wrap hp-acct-trip-row-wrap ${swipedOpen ? "is-open" : ""}`.trim()}>
      <SwipeDeleteButton
        open={swipedOpen}
        onDelete={onDelete}
        label={`Delete ${trip.itinerary.tripTitle}`}
      />
      <button
        type="button"
        className="hp-acct-trip-row"
        style={{
          transform: `translateX(${offset}px)`,
          transition: swiping ? "none" : "transform 0.2s ease",
          touchAction: "pan-y",
        }}
        onClick={() => {
          if (shouldIgnoreClick()) return;
          if (swipedOpen) {
            onSwipedOpenChange(false);
            return;
          }
          onOpen();
        }}
        {...handlers}
      >
        <img src={resolveBackground(trip.itinerary.destination)} alt="" />
        <span className="hp-acct-trip-info">
          <b>{trip.itinerary.tripTitle}</b>
          <span>
            <Value>
              {formatDateRange(trip.itinerary.startDate, trip.itinerary.numDays) ?? "Dates tbc"}
            </Value>{" "}
            · passport earned
          </span>
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
  notifyWrapUp,
  onOpenActive,
  onOpenConfirm,
  onDeleteActive,
  onDeleteSaved,
  tripUndoMessage,
  onUndoDelete,
  membership,
}: Props) {
  const [openTrip, setOpenTrip] = useState<SavedTrip | null>(null);
  const [checklistOpen, setChecklistOpen] = useState(false);
  // Which card, if any, is swiped open showing its Delete button — one id for
  // both lists, so only ever one Delete is exposed on the screen at a time.
  const [swipedTripId, setSwipedTripId] = useState<string | null>(null);

  if (openTrip) {
    return (
      <PassportScreen
        itinerary={openTrip.itinerary}
        completedStopIds={new Set(openTrip.completedStopIds ?? [])}
        onBack={() => setOpenTrip(null)}
        backLabel="‹ Your trips"
        membership={membership}
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
            {/* The city, the day count and the number of things left all change
                as the trip nears and the checklist gets ticked off — and the
                wording around each varies with it (today / in 1 day / in 3
                days), so each is protected whole. See Value in ui/primitives. */}
            <span>
              <Value>
                {daysOut === 0
                  ? `Your ${cityName(itinerary.destination)} trip starts today`
                  : `Your ${cityName(itinerary.destination)} trip starts in ${daysOut} day${daysOut === 1 ? "" : "s"}`}
              </Value>
              {" — "}
              <Value>{`${prepRemaining} thing${prepRemaining === 1 ? "" : "s"}`}</Value> left to prepare
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
              notifyWrapUp={notifyWrapUp}
              swipedOpen={swipedTripId === itinerary.id}
              onSwipedOpenChange={(open) => setSwipedTripId(open ? itinerary.id : null)}
              onOpen={onOpenActive}
              onOpenConfirm={onOpenConfirm}
              onDelete={() => {
                setSwipedTripId(null);
                onDeleteActive();
              }}
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
                  swipedOpen={swipedTripId === trip.itinerary.id}
                  onSwipedOpenChange={(open) => setSwipedTripId(open ? trip.itinerary.id : null)}
                  onOpen={() => setOpenTrip(trip)}
                  onDelete={() => {
                    setSwipedTripId(null);
                    onDeleteSaved(trip.itinerary.id);
                  }}
                />
              ))}
            </div>
          </section>
        )}
      </div>

      {tripUndoMessage && (
        <div className="hp-undo" role="status">
          {/* Keyed, not no-translate — prose that must stay current. See Value
              in ui/primitives. */}
          <span key={tripUndoMessage}>{tripUndoMessage}</span>
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
