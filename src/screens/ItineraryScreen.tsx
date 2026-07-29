import { useEffect, useMemo, useRef, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type { DragEndEvent, DragStartEvent, Modifier } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { AccommodationOption, ChatMessage, Itinerary, Stop, TripBudget } from "../types";
import { reorderStopWithinDay, deleteStop } from "../utils/itineraryEdit";
import { scheduleForDay, getNextUp } from "../utils/schedule";
import { useSwipeToReveal } from "../hooks/useSwipeToReveal";
import { cityName, dayLabel, isDuringTrip, isTripOver, tripDayIndex } from "../utils/destination";
import { convertMoney, currencyCodeFromLabel } from "../utils/currency";
import { StampRing, SwipeDeleteButton, Value } from "../components/ui/primitives";
import type { Membership } from "../hooks/useMembership";
import { UpgradeSheet } from "../components/membership/UpgradeSheet";
import type { FeatureKey } from "../data/plans";
import { DestinationBackground } from "../components/DestinationBackground";
import { MapView } from "../components/MapPanel/MapView";
import { CardDetail } from "../components/itinerary/CardDetail";
import { TripInfoCard } from "../components/itinerary/TripInfoCard";
import { MapScreen } from "../components/itinerary/MapScreen";
import { BudgetScreen } from "../components/itinerary/BudgetScreen";
import { PreferencesScreen } from "../components/itinerary/PreferencesScreen";
import { HotelsScreen } from "../components/itinerary/HotelsScreen";
import { HotelDetailCard } from "../components/itinerary/HotelDetailCard";
import { ConfirmScreen } from "../components/itinerary/ConfirmScreen";
import { ChecklistScreen } from "../components/itinerary/ChecklistScreen";
import { CHECKLIST_ITEMS } from "../data/checklistItems";
import {
  CloseIcon,
  GripIcon,
  MapTargetIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  PlusCircleIcon,
  ArrowUpIcon,
} from "../components/ui/icons";

/** A stop can only move up and down its day. Reordering a vertical list has no
 *  horizontal meaning, and letting the card wander sideways under the finger
 *  reads as a swipe that isn't going to do anything. */
const verticalOnly: Modifier = ({ transform }) => ({ ...transform, x: 0 });

/** How long a press has to be held before the card lifts, in ms, and how far
 *  the finger may stray in that time. Below the tolerance the press is a hold;
 *  above it the movement belongs to the list's scroll or a swipe, and no drag
 *  starts. Kept under the swipe gesture's own 8px slop so the two can't both
 *  claim the same movement. */
const HOLD_TO_LIFT_MS = 220;
const HOLD_TOLERANCE_PX = 6;

interface Props {
  itinerary: Itinerary;
  chatHistory: ChatMessage[];
  chatLoading: boolean;
  /** Stops changed by the most recent chat turn — rendered with the coral UPDATED state. */
  updatedStopIds: Set<string>;
  onSendChat: (message: string) => void;
  /** Records undo + marks changed stops with the coral UPDATED note. */
  onItineraryChange: (next: Itinerary, message: string, changedIds: string[]) => void;
  /** Non-null while an undo is still available. */
  undoMessage: string | null;
  onUndo: () => void;
  onAddAccommodation: () => void;
  onConfirmAccommodation: (accommodationId: string, optionId: string) => void;
  completedStopIds: Set<string>;
  onToggleStopVisited: (stopId: string, visited: boolean) => void;
  onShowPassport: () => void;
  /** Account currency preference, e.g. "USD ($)" — drives the trip budget display. */
  currency: string;
  onCurrencyChange: (currency: string) => void;
  checklistDone: Set<string>;
  onToggleChecklistItem: (itemId: string) => void;
  /** What the user wants the trip to cost, and the budget as it was before the
   *  last edit — both client-side only; see useActiveTrip. */
  budgetTarget: string | null;
  onBudgetTargetChange: (target: string | null) => void;
  previousBudget?: TripBudget | null;
  /** Opens straight to the Confirm sheet — used by the Trips tab's "Trip over" nudge. */
  initialConfirmOpen?: boolean;
  membership: Membership;
}

export function ItineraryScreen({
  itinerary,
  chatHistory,
  chatLoading,
  updatedStopIds,
  onSendChat,
  onItineraryChange,
  undoMessage,
  onUndo,
  onAddAccommodation,
  onConfirmAccommodation,
  completedStopIds,
  onToggleStopVisited,
  onShowPassport,
  currency,
  onCurrencyChange,
  checklistDone,
  onToggleChecklistItem,
  budgetTarget,
  onBudgetTargetChange,
  previousBudget,
  initialConfirmOpen = false,
  membership,
}: Props) {
  const duringTrip = isDuringTrip(itinerary.startDate, itinerary.numDays);
  const tripOver = isTripOver(itinerary.startDate, itinerary.numDays);
  const [selectedDay, setSelectedDay] = useState(() => {
    if (duringTrip) {
      const todayIndex = tripDayIndex(itinerary.startDate);
      if (todayIndex && itinerary.days.some((d) => d.dayNumber === todayIndex)) return todayIndex;
    }
    return itinerary.days[0]?.dayNumber ?? 1;
  });
  const [mapOpen, setMapOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [openStop, setOpenStop] = useState<Stop | null>(null);
  const [tripInfoOpen, setTripInfoOpen] = useState(false);
  const [mapFull, setMapFull] = useState(false);
  const [budgetOpen, setBudgetOpen] = useState(false);
  const [draggingStop, setDraggingStop] = useState<Stop | null>(null);
  const [prefsOpen, setPrefsOpen] = useState(false);
  const [hotelsOpen, setHotelsOpen] = useState(false);
  const [openHotel, setOpenHotel] = useState<AccommodationOption | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(initialConfirmOpen);
  const [checklistOpen, setChecklistOpen] = useState(false);
  // Which locked feature the user just reached for, if any — drives UpgradeSheet.
  const [lockedFeature, setLockedFeature] = useState<FeatureKey | null>(null);

  // Per the revenue model, this trip needs its own Trip Pass (or Premium)
  // before AI editing and the budget open. Manual edits — drag to reorder,
  // swipe to remove — stay on the free plan, so the itinerary is never
  // read-only; see useMembership.
  const unlocked = membership.isTripUnlocked(itinerary.id);

  const day = useMemo(
    () => itinerary.days.find((d) => d.dayNumber === selectedDay) ?? itinerary.days[0],
    [itinerary.days, selectedDay],
  );
  const times = useMemo(() => (day ? scheduleForDay(day) : new Map()), [day]);
  const nextUp = useMemo(
    () => (duringTrip ? getNextUp(itinerary, completedStopIds) : null),
    [duringTrip, itinerary, completedStopIds],
  );

  // One pointer sensor covers mouse, touch and pen. The whole card is the
  // handle now, so the drag can't start on movement alone — that would fight
  // both the list's scrolling and the swipe gesture. It starts on a held
  // press instead, which is what picking something up feels like.
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { delay: HOLD_TO_LIFT_MS, tolerance: HOLD_TOLERANCE_PX },
    }),
  );

  // Which stop row, if any, is swiped open showing its Delete button. Held
  // here rather than in the row so that opening one closes the last.
  const [swipedStopId, setSwipedStopId] = useState<string | null>(null);

  const firstStay = itinerary.accommodations?.[0];
  const hasAccommodation = (itinerary.accommodations?.length ?? 0) > 0;
  const stayLabel =
    firstStay && firstStay.options.length === 1
      ? firstStay.options[0].name
      : firstStay
        ? `${firstStay.options.length} options`
        : "";
  const lastAssistant = [...chatHistory].reverse().find((m) => m.role === "assistant");

  // The assistant's reply stays until it's dismissed — it's an account of what
  // just changed on screen, and six seconds wasn't long enough to read it
  // against the itinerary it describes.
  //
  // Which means it can't simply render whenever chatHistory has a reply in it:
  // that history is persisted, so the last reply would greet you again on every
  // reload and every return to this tab, with nothing to explain it. So the
  // note is tied to a reply *arriving* while the screen is open. The ref starts
  // at whatever was already in history at mount, and only an id different from
  // that counts as new.
  const [openNoteId, setOpenNoteId] = useState<string | null>(null);
  const seenNoteRef = useRef<string | undefined>(lastAssistant?.id);
  useEffect(() => {
    const id = lastAssistant?.id;
    if (!id || id === seenNoteRef.current) return;
    seenNoteRef.current = id;
    setOpenNoteId(id);
  }, [lastAssistant?.id]);
  const noteVisible = Boolean(openNoteId) && openNoteId === lastAssistant?.id;

  function handleDragStart(event: DragStartEvent) {
    const stop = day?.stops.find((s) => s.id === event.active.id);
    setDraggingStop(stop ?? null);
    // A card that's about to be carried shouldn't still be holding a Delete
    // button open behind it.
    setSwipedStopId(null);
  }

  function handleDragEnd(event: DragEndEvent) {
    setDraggingStop(null);
    const { active, over } = event;
    if (!over || !day || active.id === over.id) return;
    const from = day.stops.findIndex((s) => s.id === active.id);
    const to = day.stops.findIndex((s) => s.id === over.id);
    if (from === -1 || to === -1) return;
    const moved = day.stops[from];
    onItineraryChange(
      reorderStopWithinDay(itinerary, day.dayNumber, from, to),
      `${moved.name} moved`,
      [moved.id],
    );
  }

  function handleSend() {
    const message = draft.trim();
    if (!message || chatLoading) return;
    // The draft is deliberately left in the box: if they unlock, the sentence
    // they already typed is still there to send.
    if (!unlocked) {
      setLockedFeature("aiEditing");
      return;
    }
    setDraft("");
    onSendChat(message);
  }

  // Pressing the Delete button a swipe uncovered — still routed through the
  // same undo pipeline as every other edit (reorder, chat), so it stays
  // reversible for 8s even though it now takes a deliberate press to get here.
  function handleRemoveStop(stopId: string) {
    setSwipedStopId(null);
    const result = deleteStop(itinerary, stopId);
    if (!result) return;
    onItineraryChange(result.itinerary, `Removed — ${result.removed.name}`, []);
  }

  return (
    <div className="hp-screen hp-itin">
      <DestinationBackground destination={itinerary.destination} />

      <header className="hp-itin-head">
        {/* A place name and a day count, joined into one string: two adjacent
            expressions are exactly what a translator merges into a node React
            can no longer update. See Value in ui/primitives. */}
        {/* The header is the trip name and nothing else now. The bookmark went
            because saving already happens on its own when a passport is
            generated, and "Trip info" moved into the list below, where it reads
            as something you can open. */}
        <h1 translate="no">{`${cityName(itinerary.destination)} · ${dayLabel(itinerary.numDays)}`}</h1>
      </header>

      <div className="hp-itin-days">
        {itinerary.days.map((d) => (
          <button
            key={d.dayNumber}
            type="button"
            className={`hp-chip ${d.dayNumber === selectedDay ? "is-selected" : ""}`.trim()}
            onClick={() => setSelectedDay(d.dayNumber)}
          >
            Day {d.dayNumber}
          </button>
        ))}
      </div>

      <div className="hp-itin-scroll">
        {tripOver && (
          <button type="button" className="hp-itin-next-banner" onClick={() => setConfirmOpen(true)}>
            <span>
              <span className="hp-label">Trip over</span>
              <strong>Generate your {cityName(itinerary.destination)} passport</strong>
            </span>
            <span aria-hidden>→</span>
          </button>
        )}

        {nextUp && (
          <button
            type="button"
            className="hp-itin-next-banner"
            onClick={() => {
              setSelectedDay(nextUp.dayNumber);
              setOpenStop(nextUp.stop);
            }}
          >
            <span>
              <span className="hp-label">
                Happening next
                <Value>
                  {`${nextUp.time ? ` · ${nextUp.time}` : ""}${
                    nextUp.dayNumber !== selectedDay ? ` · Day ${nextUp.dayNumber}` : ""
                  }`}
                </Value>
              </span>
              <strong translate="no">{nextUp.stop.name}</strong>
            </span>
            <span aria-hidden>→</span>
          </button>
        )}

        {!duringTrip && !tripOver && (
          <button type="button" className="hp-itin-next-banner" onClick={() => setChecklistOpen(true)}>
            <span>
              <span className="hp-label">Before you go</span>
              {/* Only the counts are protected — "of" and "ready" never change,
                  so a translator can own those safely. */}
              <strong>
                <Value>{CHECKLIST_ITEMS.filter((item) => checklistDone.has(item.id)).length}</Value> of{" "}
                <Value>{CHECKLIST_ITEMS.length}</Value> ready
              </strong>
            </span>
            <span aria-hidden>→</span>
          </button>
        )}

        {/* What used to be the header's "Trip info". Same row pattern as Trip
            budget and Where you'll stay below, because it is the same kind of
            thing — a labelled row that opens a detail — and matching two
            neighbours the user has already learned is what makes it read as
            tappable. The subtitle does the other half of the work: "Trip info"
            sounded like the dates and stops already on screen, when what's
            actually inside is the destination's practicalities.

            Sits above the map rather than down with the other rows because the
            problem being fixed is that nobody found it; below the stop list is
            below the fold. The subtitle is deliberately static — showing live
            values here would mean paying for a destination-info call on every
            itinerary view, tapped or not. */}
        <button type="button" className="hp-budget-row" onClick={() => setTripInfoOpen(true)}>
          <span>
            <span className="hp-label">Good to know</span>
            <strong className="hp-goodtoknow-sub">Local time, currency, plugs and tips</strong>
          </span>
          <ChevronRightIcon size={18} />
        </button>

        {/* Collapsed map card — expands in place */}
        <div className={`hp-map-card ${mapOpen ? "is-open" : ""}`.trim()}>
          <button type="button" className="hp-map-card-row" onClick={() => setMapOpen((o) => !o)}>
            <span className="hp-map-card-label">
              <MapTargetIcon size={22} />
              Map
            </span>
            <ChevronDownIcon size={18} className={mapOpen ? "hp-rot180" : undefined} />
          </button>
          {mapOpen && (
            // Preview only — taps open the full-screen map (per the design), so
            // the embedded map itself is inert to avoid fighting the tap.
            <div
              className="hp-map-card-body"
              role="button"
              tabIndex={0}
              onClick={() => setMapFull(true)}
              onKeyDown={(e) => e.key === "Enter" && setMapFull(true)}
              aria-label="Open full map"
            >
              <MapView
                itinerary={itinerary}
                selectedDay={selectedDay}
                highlightedStopId={null}
                flyToStop={null}
                fitSignal={selectedDay}
                onStopClick={() => {}}
                selectedStopId={null}
                placeInfo={null}
                placeInfoLoading={false}
                onCloseDetail={() => {}}
                selectedAccommodationOptionId={null}
                onAccommodationOptionClick={() => {}}
                onConfirmAccommodationOption={() => {}}
                completedStopIds={new Set()}
              />
            </div>
          )}
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          modifiers={[verticalOnly]}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={() => setDraggingStop(null)}
        >
          <SortableContext
            items={day?.stops.map((s) => s.id) ?? []}
            strategy={verticalListSortingStrategy}
          >
            {day?.stops.map((stop) => (
              <StopRow
                key={stop.id}
                stop={stop}
                time={times.get(stop.id) ?? ""}
                updated={updatedStopIds.has(stop.id)}
                next={nextUp?.dayNumber === day.dayNumber && nextUp.stop.id === stop.id}
                swipedOpen={swipedStopId === stop.id}
                onSwipedOpenChange={(open) => setSwipedStopId(open ? stop.id : null)}
                onOpen={() => setOpenStop(stop)}
                onRemove={() => handleRemoveStop(stop.id)}
              />
            ))}
          </SortableContext>

          {/* Lifted copy that follows the pointer while dragging. */}
          <DragOverlay>
            {draggingStop && (
              <div className="hp-stop-row hp-stop-row-overlay">
                <div className="hp-stop-row-text">
                  <span className="hp-stop-row-time" translate="no">
                    {times.get(draggingStop.id) ?? ""}
                  </span>
                  <strong translate="no">{draggingStop.name}</strong>
                </div>
                <span className="hp-grip">
                  <GripIcon size={20} />
                </span>
              </div>
            )}
          </DragOverlay>
        </DndContext>

        {hasAccommodation ? (
          <button type="button" className="hp-budget-row" onClick={() => setHotelsOpen(true)}>
            <span>
              <span className="hp-label">Where you'll stay</span>
              {/* Either a hotel name or "3 options" — the wording varies with
                  the value, so the whole thing is protected. */}
              <strong translate="no">{stayLabel}</strong>
            </span>
            <ChevronRightIcon size={18} />
          </button>
        ) : (
          // Asking for stays is an AI edit under the hood (it sends a chat
          // instruction), so it sits behind the same gate as the chat bar.
          <button
            type="button"
            className="hp-add-accom"
            onClick={() => (unlocked ? onAddAccommodation() : setLockedFeature("aiEditing"))}
          >
            <PlusCircleIcon size={18} />
            Add accommodation
          </button>
        )}

        <button
          type="button"
          className="hp-budget-row"
          onClick={() => (unlocked ? setBudgetOpen(true) : setLockedFeature("budget"))}
        >
          <span>
            <span className="hp-label">
              Trip budget
              {!unlocked && <span className="hp-lock-pill">TRIP PASS</span>}
            </span>
            {/* The total itself stays behind the gate — showing the number here
                would give away the thing the budget planner is selling. */}
            <strong>
              {!unlocked ? (
                "See what this trip costs"
              ) : itinerary.budget ? (
                <>
                  <Value>{convertMoney(itinerary.budget.total, currencyCodeFromLabel(currency))}</Value>{" "}
                  estimated
                </>
              ) : (
                "Tap to estimate"
              )}
            </strong>
          </span>
          <ChevronRightIcon size={18} />
        </button>

        <button type="button" className="hp-trip-over" onClick={() => setConfirmOpen(true)}>
          Trip over? Generate your passport →
        </button>
      </div>

      {undoMessage && (
        <div className="hp-undo" role="status">
          {/* Prose, so it's keyed rather than marked no-translate: a fresh
              element per message stays both translated and current. Frozen, it
              would name the wrong stop while Undo reverses a different edit.
              See Value in ui/primitives. */}
          <span key={undoMessage}>{undoMessage}</span>
          <button type="button" onClick={onUndo}>
            Undo
          </button>
        </div>
      )}

      {chatLoading && (
        <div className="hp-chat-progress" role="status">
          <StampRing size={20} spinning />
          <span>Updating your trip…</span>
        </div>
      )}

      {lastAssistant && !chatLoading && noteVisible && (
        // Keyed on the reply id so each new one mounts a fresh element — this is
        // Claude's account of what it just changed, the one thing here that most
        // wants to be readable in the reader's own language and most misleads if
        // it goes stale. See Value in ui/primitives.
        <div className="hp-assistant-note" key={lastAssistant.id} role="status">
          <span>{lastAssistant.content}</span>
          <button
            type="button"
            className="hp-icon-btn hp-assistant-note-close"
            aria-label="Dismiss"
            onClick={() => setOpenNoteId(null)}
          >
            <CloseIcon size={18} />
          </button>
        </div>
      )}

      {/* Left usable while locked rather than disabled: the user can type what
          they want, and the upgrade prompt appears on send with their sentence
          still in the box, ready to go the moment it unlocks. */}
      <div className="hp-chat-bar">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder={
            chatLoading
              ? "Updating your trip…"
              : unlocked
                ? "Swap lunch for something local…"
                : "AI editing is on Trip Pass — tap to see"
          }
          disabled={chatLoading}
          aria-label="Tailor your trip"
        />
        <button
          type="button"
          className="hp-chat-send"
          onClick={handleSend}
          disabled={chatLoading || (unlocked && !draft.trim())}
          aria-label={unlocked ? "Send" : "Unlock AI editing"}
        >
          <ArrowUpIcon size={18} />
        </button>
      </div>

      <CardDetail
        stop={openStop}
        index={openStop && day ? day.stops.findIndex((s) => s.id === openStop.id) + 1 : 0}
        time={openStop ? (times.get(openStop.id) ?? "") : ""}
        destination={itinerary.destination}
        onClose={() => setOpenStop(null)}
      />

      <TripInfoCard
        open={tripInfoOpen}
        destination={itinerary.destination}
        center={itinerary.destinationCenter}
        onClose={() => setTripInfoOpen(false)}
      />

      <MapScreen
        open={mapFull}
        itinerary={itinerary}
        selectedDay={selectedDay}
        onSelectDay={setSelectedDay}
        onOpenStop={(stop) => {
          setMapFull(false);
          setOpenStop(stop);
        }}
        onClose={() => setMapFull(false)}
        completedStopIds={completedStopIds}
      />

      <BudgetScreen
        open={budgetOpen}
        budget={itinerary.budget}
        previousBudget={previousBudget}
        target={budgetTarget}
        currency={currency}
        onClose={() => setBudgetOpen(false)}
        onOpenPreferences={() => {
          setBudgetOpen(false);
          setPrefsOpen(true);
        }}
      />

      {/* Applying preferences regenerates through chat, so it's the same
          entitlement as the chat bar — gated here rather than inside
          PreferencesScreen, which stays a dumb form. */}
      <PreferencesScreen
        open={prefsOpen}
        currentPreferences={itinerary.preferences}
        currency={currency}
        onCurrencyChange={onCurrencyChange}
        currentBudgetTotal={itinerary.budget?.total}
        budgetTarget={budgetTarget}
        onBudgetTargetChange={onBudgetTargetChange}
        onClose={() => setPrefsOpen(false)}
        onApply={(message) => {
          if (!unlocked) {
            setPrefsOpen(false);
            setLockedFeature("aiEditing");
            return;
          }
          onSendChat(message);
        }}
      />

      <HotelsScreen
        open={hotelsOpen}
        accommodation={firstStay}
        destination={itinerary.destination}
        onClose={() => setHotelsOpen(false)}
        onOpenDetail={setOpenHotel}
        onConfirm={onConfirmAccommodation}
      />

      <HotelDetailCard
        option={openHotel}
        destination={itinerary.destination}
        confirmed={firstStay?.options.length === 1 && firstStay.options[0].id === openHotel?.id}
        onClose={() => setOpenHotel(null)}
        onChoose={() => {
          if (firstStay && openHotel) {
            onConfirmAccommodation(firstStay.id, openHotel.id);
            setOpenHotel(null);
            setHotelsOpen(false);
          }
        }}
      />

      <ConfirmScreen
        open={confirmOpen}
        itinerary={itinerary}
        completedStopIds={completedStopIds}
        onToggle={onToggleStopVisited}
        onClose={() => setConfirmOpen(false)}
        onGeneratePassport={() => {
          setConfirmOpen(false);
          onShowPassport();
        }}
      />

      <ChecklistScreen
        open={checklistOpen}
        checklistDone={checklistDone}
        onToggle={onToggleChecklistItem}
        onClose={() => setChecklistOpen(false)}
      />

      <UpgradeSheet
        feature={lockedFeature}
        tripName={cityName(itinerary.destination)}
        onClose={() => setLockedFeature(null)}
        onBuyTripPass={() => {
          membership.buyTripPass(itinerary.id);
          setLockedFeature(null);
        }}
        onSubscribePremium={() => {
          membership.subscribePremium();
          setLockedFeature(null);
        }}
      />
    </div>
  );
}

function StopRow({
  stop,
  time,
  updated,
  next,
  swipedOpen,
  onSwipedOpenChange,
  onOpen,
  onRemove,
}: {
  stop: Stop;
  time: string;
  updated: boolean;
  next: boolean;
  swipedOpen: boolean;
  onSwipedOpenChange: (open: boolean) => void;
  onOpen: () => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: stop.id,
  });
  const { offset, swiping, shouldIgnoreClick, handlers } = useSwipeToReveal({
    open: swipedOpen,
    onOpenChange: onSwipedOpenChange,
    disabled: isDragging,
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`hp-swipe-wrap hp-stop-row-wrap ${swipedOpen ? "is-open" : ""}`.trim()}
    >
      {/* The button lives behind the card, which normally hides it completely.
          A lifted card is translucent, though, so it would show through as a
          coral panel on a card that was never swiped — and a drag has already
          closed any open row, so there is nothing for it to be doing here. */}
      {!isDragging && (
        <SwipeDeleteButton open={swipedOpen} onDelete={onRemove} label={`Delete ${stop.name}`} />
      )}
      {/* The card is its own drag handle: the sensor's hold delay is what
          separates picking it up from tapping it or swiping it. */}
      <div
        className={`hp-stop-row ${updated ? "is-updated" : ""} ${next ? "is-next" : ""} ${isDragging ? "is-dragging" : ""} ${offset !== 0 ? "hp-swipe-open-edge" : ""}`.trim()}
        style={{
          transform: `translateX(${offset}px)`,
          transition: swiping ? "none" : "transform 0.2s ease",
          // pan-y while resting so the list still scrolls off a card; once the
          // card is lifted nothing else may claim the gesture.
          touchAction: isDragging ? "none" : "pan-y",
        }}
        onClick={() => {
          if (shouldIgnoreClick()) return;
          // While the Delete button is showing, a tap on the card puts it away
          // rather than opening the stop — the same escape as tapping outside.
          if (swipedOpen) {
            onSwipedOpenChange(false);
            return;
          }
          onOpen();
        }}
        {...attributes}
        {...handlers}
        // Both gestures begin on the same press, so this one handler feeds
        // both: dnd-kit starts counting out its hold, the swipe hook records
        // where the finger landed. Spreading them would have let the second
        // spread quietly drop the first one's onPointerDown.
        onPointerDown={(e) => {
          handlers.onPointerDown(e);
          listeners?.onPointerDown?.(e);
        }}
      >
        {/* The time and the stop name both change in place when a chat edit
            rewrites the day — the same stop id keeps the same DOM nodes — so
            these are the two most important values in the app to keep out of a
            translator's hands. See Value in ui/primitives. */}
        <div className="hp-stop-row-text">
          <span className="hp-stop-row-time">
            <Value>{time}</Value>
            {updated && <span className="hp-updated-tag"> · UPDATED</span>}
            {!updated && next && <span className="hp-next-tag"> · NEXT</span>}
          </span>
          <strong translate="no">{stop.name}</strong>
        </div>
        {/* Not a control any more — the whole card is the handle. It stays as
            the mark that says this card can be moved. */}
        <span className="hp-grip" aria-hidden="true">
          <GripIcon size={20} />
        </span>
      </div>
    </div>
  );
}
