import type { AccommodationOption, Itinerary, StopDetails } from "../../types";
import type { PlaceInfo } from "../../api/wikipediaApi";
import { DayCard } from "./DayCard";
import { TripOverview } from "./TripOverview";

interface Props {
  itinerary: Itinerary;
  selectedDay: number | "all";
  highlightedStopId: string | null;
  expandedStopId: string | null;
  placeInfo: PlaceInfo | null;
  placeInfoLoading: boolean;
  stopDetails: StopDetails | null;
  stopDetailsLoading: boolean;
  stopDetailsError: string | null;
  selectedAccommodationOptionId: string | null;
  accommodationDetails: StopDetails | null;
  accommodationDetailsLoading: boolean;
  accommodationDetailsError: string | null;
  onHover: (stopId: string | null) => void;
  onClick: (stopId: string) => void;
  onAccommodationOptionClick: (option: AccommodationOption) => void;
  onConfirmAccommodationOption: (accommodationId: string, optionId: string) => void;
  onSelectDay: (day: number) => void;
  onDeleteStop: (stopId: string) => void;
}

export function ItineraryPanel({
  itinerary,
  selectedDay,
  highlightedStopId,
  expandedStopId,
  placeInfo,
  placeInfoLoading,
  stopDetails,
  stopDetailsLoading,
  stopDetailsError,
  selectedAccommodationOptionId,
  accommodationDetails,
  accommodationDetailsLoading,
  accommodationDetailsError,
  onHover,
  onClick,
  onAccommodationOptionClick,
  onConfirmAccommodationOption,
  onSelectDay,
  onDeleteStop,
}: Props) {
  return (
    <div className="itinerary-panel">
      {selectedDay === "all" ? (
        <TripOverview itinerary={itinerary} onSelectDay={onSelectDay} />
      ) : (
        itinerary.days
          .filter((d) => d.dayNumber === selectedDay)
          .map((day) => (
            <DayCard
              key={day.dayNumber}
              day={day}
              itinerary={itinerary}
              highlightedStopId={highlightedStopId}
              expandedStopId={expandedStopId}
              placeInfo={placeInfo}
              placeInfoLoading={placeInfoLoading}
              stopDetails={stopDetails}
              stopDetailsLoading={stopDetailsLoading}
              stopDetailsError={stopDetailsError}
              selectedAccommodationOptionId={selectedAccommodationOptionId}
              accommodationDetails={accommodationDetails}
              accommodationDetailsLoading={accommodationDetailsLoading}
              accommodationDetailsError={accommodationDetailsError}
              onHover={onHover}
              onClick={onClick}
              onAccommodationOptionClick={onAccommodationOptionClick}
              onConfirmAccommodationOption={onConfirmAccommodationOption}
              editable
              onDeleteStop={onDeleteStop}
            />
          ))
      )}
    </div>
  );
}
