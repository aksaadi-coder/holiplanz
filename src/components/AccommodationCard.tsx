import type { Accommodation, AccommodationOption, StopDetails } from "../types";
import { AccommodationOptionCard } from "./AccommodationOptionCard";

interface Props {
  accommodation: Accommodation;
  destination: string;
  selectedOptionId: string | null;
  stopDetails: StopDetails | null;
  stopDetailsLoading: boolean;
  stopDetailsError: string | null;
  onOptionClick: (option: AccommodationOption) => void;
  onConfirmOption: (accommodationId: string, optionId: string) => void;
}

export function AccommodationCard({
  accommodation,
  destination,
  selectedOptionId,
  stopDetails,
  stopDetailsLoading,
  stopDetailsError,
  onOptionClick,
  onConfirmOption,
}: Props) {
  const nights = accommodation.endDay - accommodation.startDay + 1;
  const canConfirm = accommodation.options.length > 1;
  return (
    <div className="accommodation-card">
      <div className="accommodation-card-heading">
        <span className="accommodation-card-label">Where you're staying</span>
        <span className="accommodation-card-meta">
          Day {accommodation.startDay}
          {accommodation.endDay !== accommodation.startDay ? `-${accommodation.endDay}` : ""} ({nights} night
          {nights === 1 ? "" : "s"})
        </span>
      </div>
      <div className="accommodation-options">
        {accommodation.options.map((option) => {
          const expanded = option.id === selectedOptionId;
          return (
            <AccommodationOptionCard
              key={option.id}
              option={option}
              destination={destination}
              expanded={expanded}
              stopDetails={expanded ? stopDetails : null}
              stopDetailsLoading={expanded && stopDetailsLoading}
              stopDetailsError={expanded ? stopDetailsError : null}
              onClick={() => onOptionClick(option)}
              onConfirm={canConfirm ? () => onConfirmOption(accommodation.id, option.id) : undefined}
            />
          );
        })}
      </div>
    </div>
  );
}
