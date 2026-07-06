import { useMemo, useRef, useState } from "react";
import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  closestCenter,
  pointerWithin,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type { CollisionDetection, DragEndEvent, DragStartEvent } from "@dnd-kit/core";
import type { AccommodationOption, ChatMessage, DestinationInfo, Itinerary, Stop, StopDetails } from "../types";
import { fetchDestinationInfo, fetchStopDetails } from "../api/itineraryApi";
import { fetchPlaceInfo, type PlaceInfo } from "../api/wikipediaApi";
import { fetchWeather, type WeatherInfo } from "../api/weatherApi";
import { previewItineraryPdf, shareItineraryPdf } from "../utils/pdf";
import { deleteStop, findStop, moveStopToDay, reorderStopWithinDay } from "../utils/itineraryEdit";
import { Header } from "./Header";
import { DaySelector, DAY_TAB_PREFIX } from "./DaySelector";
import { DropDock, DOCK_PREFIX } from "./DropDock";
import { MapView } from "./MapPanel/MapView";
import { DestinationInfoModal } from "./DestinationInfoModal";
import { AddAccommodationModal } from "./AddAccommodationModal";
import { ItineraryPanel } from "./ItineraryPanel/ItineraryPanel";
import { PrintItinerary } from "./ItineraryPanel/PrintItinerary";
import { ChatPanel } from "./ChatPanel/ChatPanel";
import { UndoToast } from "./UndoToast";

interface Props {
  itinerary: Itinerary;
  chatHistory: ChatMessage[];
  chatLoading: boolean;
  saved: boolean;
  onStartOver: () => void;
  onSendChat: (message: string) => void;
  onToggleSave: () => void;
  onConfirmAccommodationOption: (accommodationId: string, optionId: string) => void;
  onUpdateItinerary: (next: Itinerary) => void;
}

// Prefer whatever is directly under the pointer (day tabs, dock chips, cards);
// fall back to nearest-center so gaps between cards still resolve to a target.
const dndCollisions: CollisionDetection = (args) => {
  const within = pointerWithin(args);
  return within.length > 0 ? within : closestCenter(args);
};

function dropTargetDay(overId: string): number | null {
  if (overId.startsWith(DAY_TAB_PREFIX)) return Number(overId.slice(DAY_TAB_PREFIX.length));
  if (overId.startsWith(DOCK_PREFIX)) return Number(overId.slice(DOCK_PREFIX.length));
  return null;
}

function dayListLabel(days: Set<number>): string {
  const sorted = [...days].sort((a, b) => a - b);
  if (sorted.length === 1) return `day ${sorted[0]}`;
  return `days ${sorted.slice(0, -1).join(", ")} and ${sorted[sorted.length - 1]}`;
}

export function TripView({
  itinerary,
  chatHistory,
  chatLoading,
  saved,
  onStartOver,
  onSendChat,
  onToggleSave,
  onConfirmAccommodationOption,
  onUpdateItinerary,
}: Props) {
  const [selectedDay, setSelectedDay] = useState<number | "all">("all");
  const [highlightedStopId, setHighlightedStopId] = useState<string | null>(null);
  const [selectedStopId, setSelectedStopId] = useState<string | null>(null);
  const [placeInfo, setPlaceInfo] = useState<PlaceInfo | null>(null);
  const [placeInfoLoading, setPlaceInfoLoading] = useState(false);
  const [stopDetails, setStopDetails] = useState<StopDetails | null>(null);
  const [stopDetailsLoading, setStopDetailsLoading] = useState(false);
  const [stopDetailsError, setStopDetailsError] = useState<string | null>(null);
  const [fitSignal, setFitSignal] = useState(0);
  const stopDetailsCacheRef = useRef(new Map<string, StopDetails>());
  const [selectedAccommodationOptionId, setSelectedAccommodationOptionId] = useState<string | null>(null);
  const [accommodationDetails, setAccommodationDetails] = useState<StopDetails | null>(null);
  const [accommodationDetailsLoading, setAccommodationDetailsLoading] = useState(false);
  const [accommodationDetailsError, setAccommodationDetailsError] = useState<string | null>(null);
  const accommodationDetailsCacheRef = useRef(new Map<string, StopDetails>());
  const accommodationRequestIdRef = useRef(0);
  const [showDestinationInfo, setShowDestinationInfo] = useState(false);
  const [destinationInfo, setDestinationInfo] = useState<DestinationInfo | null>(null);
  const [weather, setWeather] = useState<WeatherInfo | null>(null);
  const [destinationInfoLoading, setDestinationInfoLoading] = useState(false);
  const [destinationInfoError, setDestinationInfoError] = useState<string | null>(null);
  const [showAddAccommodation, setShowAddAccommodation] = useState(false);
  const requestIdRef = useRef(0);
  const [activeDragStop, setActiveDragStop] = useState<Stop | null>(null);
  const [undo, setUndo] = useState<{ snapshot: Itinerary; message: string; prevDirty: Set<number> } | null>(
    null,
  );
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [dirtyDays, setDirtyDays] = useState<Set<number>>(new Set());

  const dndSensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 300, tolerance: 8 } }),
  );

  const selectedStop = useMemo(() => {
    if (!selectedStopId) return null;
    for (const day of itinerary.days) {
      const stop = day.stops.find((s) => s.id === selectedStopId);
      if (stop) return stop;
    }
    return null;
  }, [itinerary.days, selectedStopId]);

  function handleStopSelect(stopId: string) {
    handleCloseAccommodationDetail();

    if (selectedStopId === stopId) {
      handleCloseDetail();
      return;
    }

    setHighlightedStopId(stopId);
    setSelectedStopId(stopId);

    const stop = itinerary.days.flatMap((d) => d.stops).find((s) => s.id === stopId);
    if (!stop) return;

    const requestId = ++requestIdRef.current;
    setPlaceInfo(null);
    setPlaceInfoLoading(true);
    fetchPlaceInfo(stop.name, itinerary.destination)
      .then((info) => {
        if (requestIdRef.current !== requestId) return;
        setPlaceInfo(info);
      })
      .finally(() => {
        if (requestIdRef.current !== requestId) return;
        setPlaceInfoLoading(false);
      });

    const cached = stopDetailsCacheRef.current.get(stopId);
    if (cached) {
      setStopDetails(cached);
      setStopDetailsLoading(false);
      setStopDetailsError(null);
      return;
    }

    setStopDetails(null);
    setStopDetailsLoading(true);
    setStopDetailsError(null);
    fetchStopDetails(itinerary.destination, stop.name, stop.category)
      .then((details) => {
        if (requestIdRef.current !== requestId) return;
        stopDetailsCacheRef.current.set(stopId, details);
        setStopDetails(details);
      })
      .catch((err) => {
        if (requestIdRef.current !== requestId) return;
        setStopDetailsError(err instanceof Error ? err.message : "Couldn't load more info right now.");
      })
      .finally(() => {
        if (requestIdRef.current !== requestId) return;
        setStopDetailsLoading(false);
      });
  }

  function handleCloseDetail() {
    requestIdRef.current++;
    setSelectedStopId(null);
    setPlaceInfo(null);
    setPlaceInfoLoading(false);
    setStopDetails(null);
    setStopDetailsLoading(false);
    setStopDetailsError(null);
  }

  function handleAccommodationOptionClick(option: AccommodationOption) {
    handleCloseDetail();

    if (selectedAccommodationOptionId === option.id) {
      handleCloseAccommodationDetail();
      return;
    }

    setSelectedAccommodationOptionId(option.id);

    const requestId = ++accommodationRequestIdRef.current;
    const cached = accommodationDetailsCacheRef.current.get(option.id);
    if (cached) {
      setAccommodationDetails(cached);
      setAccommodationDetailsLoading(false);
      setAccommodationDetailsError(null);
      return;
    }

    setAccommodationDetails(null);
    setAccommodationDetailsLoading(true);
    setAccommodationDetailsError(null);
    fetchStopDetails(itinerary.destination, option.name, "accommodation")
      .then((details) => {
        if (accommodationRequestIdRef.current !== requestId) return;
        accommodationDetailsCacheRef.current.set(option.id, details);
        setAccommodationDetails(details);
      })
      .catch((err) => {
        if (accommodationRequestIdRef.current !== requestId) return;
        setAccommodationDetailsError(err instanceof Error ? err.message : "Couldn't load more info right now.");
      })
      .finally(() => {
        if (accommodationRequestIdRef.current !== requestId) return;
        setAccommodationDetailsLoading(false);
      });
  }

  function handleCloseAccommodationDetail() {
    accommodationRequestIdRef.current++;
    setSelectedAccommodationOptionId(null);
    setAccommodationDetails(null);
    setAccommodationDetailsLoading(false);
    setAccommodationDetailsError(null);
  }

  function handleConfirmAccommodationOption(accommodationId: string, optionId: string) {
    handleCloseAccommodationDetail();
    onConfirmAccommodationOption(accommodationId, optionId);
  }

  function handleDaySelect(day: number | "all") {
    setSelectedDay(day);
    handleCloseDetail();
    handleCloseAccommodationDetail();
    setFitSignal((n) => n + 1);
  }

  function markDirty(dayNumbers: number[]) {
    setDirtyDays((prev) => {
      const next = new Set(prev);
      dayNumbers.forEach((d) => next.add(d));
      return next;
    });
  }

  function showUndo(snapshot: Itinerary, message: string) {
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    setUndo({ snapshot, message, prevDirty: dirtyDays });
    undoTimerRef.current = setTimeout(() => setUndo(null), 6000);
  }

  function handleDeleteStop(stopId: string) {
    const result = deleteStop(itinerary, stopId);
    if (!result) return;
    if (selectedStopId === stopId) handleCloseDetail();
    showUndo(itinerary, `${result.removed.name} removed`);
    onUpdateItinerary(result.itinerary);
    markDirty([result.dayNumber]);
  }

  function handleUndo() {
    if (!undo) return;
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    onUpdateItinerary(undo.snapshot);
    setDirtyDays(undo.prevDirty);
    setUndo(null);
  }

  function handleDragStart(event: DragStartEvent) {
    const found = findStop(itinerary, String(event.active.id));
    if (!found) return;
    handleCloseDetail();
    handleCloseAccommodationDetail();
    setActiveDragStop(found.stop);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveDragStop(null);
    const { active, over } = event;
    if (!over || selectedDay === "all") return;
    const stopId = String(active.id);
    const overId = String(over.id);
    const found = findStop(itinerary, stopId);
    if (!found) return;

    const targetDay = dropTargetDay(overId);
    if (targetDay !== null) {
      if (targetDay !== selectedDay) {
        showUndo(itinerary, `Moved ${found.stop.name} to day ${targetDay}`);
        onUpdateItinerary(moveStopToDay(itinerary, stopId, targetDay));
        markDirty([selectedDay, targetDay]);
      }
      return;
    }

    const day = itinerary.days.find((d) => d.dayNumber === selectedDay);
    if (!day) return;
    const from = day.stops.findIndex((s) => s.id === stopId);
    const to = day.stops.findIndex((s) => s.id === overId);
    if (from === -1 || to === -1 || from === to) return;
    showUndo(itinerary, `Moved ${found.stop.name}`);
    onUpdateItinerary(reorderStopWithinDay(itinerary, day.dayNumber, from, to));
    markDirty([day.dayNumber]);
  }

  const tidySuggestion =
    dirtyDays.size > 0
      ? `You've rearranged ${dayListLabel(dirtyDays)} — want me to smooth out timings and flow?`
      : null;

  function handleTidyAccept() {
    const label = dayListLabel(dirtyDays);
    handleSendChat(
      `I manually rearranged ${label} (reordered, moved or removed stops myself). Please tidy up the affected day(s): adjust the timeOfDay labels, durations and how-to-get-there hints so they match the new order, keep the stops and their descriptions unchanged, and don't change any other days.`,
    );
  }

  function handleSendChat(message: string) {
    setDirtyDays(new Set());
    setUndo(null);
    onSendChat(message);
  }

  function handlePreviewPdf() {
    previewItineraryPdf(itinerary);
  }

  function handleSharePdf() {
    shareItineraryPdf(itinerary).catch((err) => {
      if (err instanceof Error && err.name === "AbortError") return;
      console.error("share PDF failed:", err);
    });
  }

  function handleAddAccommodation() {
    setShowAddAccommodation(false);
    handleSendChat(
      "Please suggest accommodation options for this trip - include 3 distinct options (budget, mid-range, boutique/luxury) covering the whole stay.",
    );
  }

  function handleShowDestinationInfo() {
    setShowDestinationInfo(true);
    if (destinationInfo || destinationInfoLoading) return;

    setDestinationInfoLoading(true);
    setDestinationInfoError(null);
    Promise.all([
      fetchDestinationInfo(itinerary.destination),
      fetchWeather(itinerary.destinationCenter.lat, itinerary.destinationCenter.lng),
    ])
      .then(([info, weatherResult]) => {
        setDestinationInfo(info);
        setWeather(weatherResult);
      })
      .catch((err) => {
        setDestinationInfoError(
          err instanceof Error ? err.message : "Couldn't load destination info right now.",
        );
      })
      .finally(() => setDestinationInfoLoading(false));
  }

  return (
    <div className="trip-view">
      <Header
        itinerary={itinerary}
        saved={saved}
        onStartOver={onStartOver}
        onToggleSave={onToggleSave}
        onPreviewPdf={handlePreviewPdf}
        onSharePdf={handleSharePdf}
        onShowDestinationInfo={handleShowDestinationInfo}
        onAddAccommodation={() => setShowAddAccommodation(true)}
      />
      <DndContext
        sensors={dndSensors}
        collisionDetection={dndCollisions}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveDragStop(null)}
      >
      <DaySelector
        days={itinerary.days}
        selectedDay={selectedDay}
        onSelect={handleDaySelect}
        dragActive={activeDragStop !== null}
      />
      <div className="trip-body">
        <div className="map-panel">
          <MapView
            itinerary={itinerary}
            selectedDay={selectedDay}
            highlightedStopId={highlightedStopId}
            flyToStop={selectedStop}
            fitSignal={fitSignal}
            onStopClick={handleStopSelect}
            selectedStopId={selectedStopId}
            placeInfo={placeInfo}
            placeInfoLoading={placeInfoLoading}
            onCloseDetail={handleCloseDetail}
            selectedAccommodationOptionId={selectedAccommodationOptionId}
            onAccommodationOptionClick={handleAccommodationOptionClick}
            onConfirmAccommodationOption={handleConfirmAccommodationOption}
          />
        </div>
        <div className="side-panel">
          <ItineraryPanel
            itinerary={itinerary}
            selectedDay={selectedDay}
            highlightedStopId={highlightedStopId}
            expandedStopId={selectedStopId}
            placeInfo={placeInfo}
            placeInfoLoading={placeInfoLoading}
            stopDetails={stopDetails}
            stopDetailsLoading={stopDetailsLoading}
            stopDetailsError={stopDetailsError}
            selectedAccommodationOptionId={selectedAccommodationOptionId}
            accommodationDetails={accommodationDetails}
            accommodationDetailsLoading={accommodationDetailsLoading}
            accommodationDetailsError={accommodationDetailsError}
            onHover={setHighlightedStopId}
            onClick={handleStopSelect}
            onAccommodationOptionClick={handleAccommodationOptionClick}
            onConfirmAccommodationOption={handleConfirmAccommodationOption}
            onSelectDay={handleDaySelect}
            onDeleteStop={handleDeleteStop}
          />
          <ChatPanel
            messages={chatHistory}
            loading={chatLoading}
            onSend={handleSendChat}
            tidySuggestion={tidySuggestion}
            onTidyAccept={handleTidyAccept}
            onTidyDismiss={() => setDirtyDays(new Set())}
          />
        </div>
      </div>
      <DragOverlay>
        {activeDragStop && (
          <div className="drag-overlay-card">
            <strong>{activeDragStop.name}</strong>
            <span>{activeDragStop.timeOfDay}</span>
          </div>
        )}
      </DragOverlay>
      {activeDragStop && <DropDock days={itinerary.days} currentDay={selectedDay} />}
      </DndContext>
      {undo && <UndoToast message={undo.message} onUndo={handleUndo} />}
      <PrintItinerary itinerary={itinerary} />
      {showDestinationInfo && (
        <DestinationInfoModal
          destination={itinerary.destination}
          loading={destinationInfoLoading}
          error={destinationInfoError}
          info={destinationInfo}
          weather={weather}
          onClose={() => setShowDestinationInfo(false)}
        />
      )}
      {showAddAccommodation && (
        <AddAccommodationModal
          loading={chatLoading}
          onSubmit={handleAddAccommodation}
          onClose={() => setShowAddAccommodation(false)}
        />
      )}
    </div>
  );
}
