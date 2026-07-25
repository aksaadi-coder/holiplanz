import { useEffect, useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type { DragEndEvent, DragStartEvent } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { AccommodationOption, ChatMessage, Itinerary, Stop } from "../types";
import { reorderStopWithinDay, deleteStop } from "../utils/itineraryEdit";
import { scheduleForDay, getNextUp } from "../utils/schedule";
import { useSwipeToDelete } from "../hooks/useSwipeToDelete";
import { cityName, dayLabel, isDuringTrip, isTripOver, tripDayIndex } from "../utils/destination";
import { convertMoney, currencyCodeFromLabel } from "../utils/currency";
import { StampRing } from "../components/ui/primitives";
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
  InfoIcon,
  GripIcon,
  MapTargetIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  PlusCircleIcon,
  ArrowUpIcon,
  BookmarkIcon,
  TrashIcon,
} from "../components/ui/icons";

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
  /** Whether this trip is bookmarked in Account → Past trips. */
  isSaved: boolean;
  onToggleSave: () => void;
  /** Account currency preference, e.g. "USD ($)" — drives the trip budget display. */
  currency: string;
  onCurrencyChange: (currency: string) => void;
  checklistDone: Set<string>;
  onToggleChecklistItem: (itemId: string) => void;
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
  isSaved,
  onToggleSave,
  currency,
  onCurrencyChange,
  checklistDone,
  onToggleChecklistItem,
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
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [checklistOpen, setChecklistOpen] = useState(false);

  const day = useMemo(
    () => itinerary.days.find((d) => d.dayNumber === selectedDay) ?? itinerary.days[0],
    [itinerary.days, selectedDay],
  );
  const times = useMemo(() => (day ? scheduleForDay(day) : new Map()), [day]);
  const nextUp = useMemo(
    () => (duringTrip ? getNextUp(itinerary, completedStopIds) : null),
    [duringTrip, itinerary, completedStopIds],
  );

  // One pointer sensor covers mouse, touch and pen. Listeners live on the grip
  // handle only, so vertical scrolling of the list still works on touch.
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  const firstStay = itinerary.accommodations?.[0];
  const hasAccommodation = (itinerary.accommodations?.length ?? 0) > 0;
  const stayLabel =
    firstStay && firstStay.options.length === 1
      ? firstStay.options[0].name
      : firstStay
        ? `${firstStay.options.length} options`
        : "";
  const lastAssistant = [...chatHistory].reverse().find((m) => m.role === "assistant");

  // The assistant's reply note is a transient confirmation, not a permanent
  // fixture — it used to stick around forever (persisted chatHistory never
  // clears it) and sit over the itinerary. Auto-hide it a few seconds after
  // each new reply; a newer reply resets the timer.
  const [noteVisible, setNoteVisible] = useState(false);
  useEffect(() => {
    if (!lastAssistant) return;
    setNoteVisible(true);
    const timer = setTimeout(() => setNoteVisible(false), 6000);
    return () => clearTimeout(timer);
  }, [lastAssistant?.id]);

  function handleDragStart(event: DragStartEvent) {
    const stop = day?.stops.find((s) => s.id === event.active.id);
    setDraggingStop(stop ?? null);
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
    setDraft("");
    onSendChat(message);
  }

  // Swipe-left-to-delete on a stop card — routed through the same undo
  // pipeline as every other edit (reorder, chat), so it's reversible for 8s.
  function handleRemoveStop(stopId: string) {
    const result = deleteStop(itinerary, stopId);
    if (!result) return;
    onItineraryChange(result.itinerary, `Removed — ${result.removed.name}`, []);
  }

  return (
    <div className="hp-screen hp-itin">
      <DestinationBackground destination={itinerary.destination} intensity={0.72} />

      <header className="hp-itin-head">
        <h1>
          {cityName(itinerary.destination)} · {dayLabel(itinerary.numDays)}
        </h1>
        <div className="hp-itin-head-actions">
          <button
            type="button"
            className={`hp-itin-save ${isSaved ? "is-saved" : ""}`.trim()}
            onClick={onToggleSave}
            aria-label={isSaved ? "Remove from saved trips" : "Save trip"}
            aria-pressed={isSaved}
          >
            <BookmarkIcon size={18} fill={isSaved ? "currentColor" : "none"} />
          </button>
          <button type="button" className="hp-itin-info" onClick={() => setTripInfoOpen(true)}>
            <InfoIcon size={18} />
            Trip info
          </button>
        </div>
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
              <strong>How was {cityName(itinerary.destination)}? Confirm what you did</strong>
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
                Happening next{nextUp.time ? ` · ${nextUp.time}` : ""}
                {nextUp.dayNumber !== selectedDay ? ` · Day ${nextUp.dayNumber}` : ""}
              </span>
              <strong>{nextUp.stop.name}</strong>
            </span>
            <span aria-hidden>→</span>
          </button>
        )}

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
                  <span className="hp-stop-row-time">{times.get(draggingStop.id) ?? ""}</span>
                  <strong>{draggingStop.name}</strong>
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
              <strong>{stayLabel}</strong>
            </span>
            <ChevronRightIcon size={18} />
          </button>
        ) : (
          <button type="button" className="hp-add-accom" onClick={onAddAccommodation}>
            <PlusCircleIcon size={18} />
            Add accommodation
          </button>
        )}

        <button type="button" className="hp-budget-row" onClick={() => setBudgetOpen(true)}>
          <span>
            <span className="hp-label">Trip budget</span>
            <strong>
              {itinerary.budget
                ? `${convertMoney(itinerary.budget.total, currencyCodeFromLabel(currency))} estimated`
                : "Tap to estimate"}
            </strong>
          </span>
          <ChevronRightIcon size={18} />
        </button>

        {!duringTrip && !tripOver && (
          <button type="button" className="hp-budget-row" onClick={() => setChecklistOpen(true)}>
            <span>
              <span className="hp-label">Before you go</span>
              <strong>
                {CHECKLIST_ITEMS.filter((item) => checklistDone.has(item.id)).length} of{" "}
                {CHECKLIST_ITEMS.length} ready
              </strong>
            </span>
            <ChevronRightIcon size={18} />
          </button>
        )}

        <button type="button" className="hp-trip-over" onClick={() => setConfirmOpen(true)}>
          Trip over? Confirm what you did →
        </button>
      </div>

      {undoMessage && (
        <div className="hp-undo" role="status">
          <span>{undoMessage}</span>
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
        <div className="hp-assistant-note">{lastAssistant.content}</div>
      )}

      <div className="hp-chat-bar">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder={chatLoading ? "Updating your trip…" : "Swap lunch for something local…"}
          disabled={chatLoading}
          aria-label="Tailor your trip"
        />
        <button
          type="button"
          className="hp-chat-send"
          onClick={handleSend}
          disabled={chatLoading || !draft.trim()}
          aria-label="Send"
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
        currency={currency}
        onClose={() => setBudgetOpen(false)}
        onOpenPreferences={() => {
          setBudgetOpen(false);
          setPrefsOpen(true);
        }}
      />

      <PreferencesScreen
        open={prefsOpen}
        currentPreferences={itinerary.preferences}
        currency={currency}
        onCurrencyChange={onCurrencyChange}
        onClose={() => setPrefsOpen(false)}
        onApply={onSendChat}
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
    </div>
  );
}

function StopRow({
  stop,
  time,
  updated,
  next,
  onOpen,
  onRemove,
}: {
  stop: Stop;
  time: string;
  updated: boolean;
  next: boolean;
  onOpen: () => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: stop.id,
  });
  const { swipeX, swiping, suppressClickRef, handlers } = useSwipeToDelete({ onDelete: onRemove });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className="hp-swipe-wrap hp-stop-row-wrap"
    >
      <div className="hp-swipe-remove-bg" aria-hidden="true">
        <TrashIcon size={18} />
        Remove
      </div>
      <div
        className={`hp-stop-row ${updated ? "is-updated" : ""} ${next ? "is-next" : ""} ${isDragging ? "is-dragging" : ""}`.trim()}
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
        <div className="hp-stop-row-text">
          <span className="hp-stop-row-time">
            {time}
            {updated && <span className="hp-updated-tag"> · UPDATED</span>}
            {!updated && next && <span className="hp-next-tag"> · NEXT</span>}
          </span>
          <strong>{stop.name}</strong>
        </div>
        <button
          type="button"
          className="hp-grip"
          aria-label={`Reorder ${stop.name}`}
          onClick={(e) => e.stopPropagation()}
          {...attributes}
          {...listeners}
        >
          <GripIcon size={20} />
        </button>
      </div>
    </div>
  );
}
