import { useMemo, useRef, useState } from "react";
import type { AccommodationOption, ChatMessage, DestinationInfo, Itinerary, StopDetails } from "../types";
import { fetchDestinationInfo, fetchStopDetails } from "../api/itineraryApi";
import { fetchPlaceInfo, type PlaceInfo } from "../api/wikipediaApi";
import { fetchWeather, type WeatherInfo } from "../api/weatherApi";
import { previewItineraryPdf, shareItineraryPdf } from "../utils/pdf";
import { Header } from "./Header";
import { DaySelector } from "./DaySelector";
import { MapView } from "./MapPanel/MapView";
import { DestinationInfoModal } from "./DestinationInfoModal";
import { AddAccommodationModal, type AddAccommodationInput } from "./AddAccommodationModal";
import { ItineraryPanel } from "./ItineraryPanel/ItineraryPanel";
import { PrintItinerary } from "./ItineraryPanel/PrintItinerary";
import { ChatPanel } from "./ChatPanel/ChatPanel";

interface Props {
  itinerary: Itinerary;
  chatHistory: ChatMessage[];
  chatLoading: boolean;
  saved: boolean;
  onStartOver: () => void;
  onSendChat: (message: string) => void;
  onToggleSave: () => void;
  onConfirmAccommodationOption: (accommodationId: string, optionId: string) => void;
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

  function handlePreviewPdf() {
    previewItineraryPdf(itinerary);
  }

  function handleSharePdf() {
    shareItineraryPdf(itinerary).catch((err) => {
      if (err instanceof Error && err.name === "AbortError") return;
      console.error("share PDF failed:", err);
    });
  }

  function handleAddAccommodation(input: AddAccommodationInput) {
    setShowAddAccommodation(false);
    const message = input.bookedAccommodation
      ? `We already booked "${input.bookedAccommodation}" for our stay, please add it as our confirmed accommodation.`
      : "Please suggest accommodation options for this trip - include 3 distinct options (budget, mid-range, boutique/luxury) covering the whole stay.";
    onSendChat(message);
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
      <DaySelector days={itinerary.days} selectedDay={selectedDay} onSelect={handleDaySelect} />
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
          />
          <ChatPanel messages={chatHistory} loading={chatLoading} onSend={onSendChat} />
        </div>
      </div>
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
