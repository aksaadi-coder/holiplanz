import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import type { AccommodationOption, Day, Itinerary, StopDetails } from "../../types";
import type { PlaceInfo } from "../../api/wikipediaApi";
import { StopCard } from "./StopCard";
import { StopCardShell } from "./StopCardShell";
import { MapView } from "../MapPanel/MapView";
import { AccommodationCard } from "../AccommodationCard";

interface Props {
  day: Day;
  itinerary: Itinerary;
  highlightedStopId: string | null;
  expandedStopId?: string | null;
  placeInfo?: PlaceInfo | null;
  placeInfoLoading?: boolean;
  stopDetails?: StopDetails | null;
  stopDetailsLoading?: boolean;
  stopDetailsError?: string | null;
  selectedAccommodationOptionId?: string | null;
  accommodationDetails?: StopDetails | null;
  accommodationDetailsLoading?: boolean;
  accommodationDetailsError?: string | null;
  onHover: (stopId: string | null) => void;
  onClick: (stopId: string) => void;
  onAccommodationOptionClick?: (option: AccommodationOption) => void;
  onConfirmAccommodationOption?: (accommodationId: string, optionId: string) => void;
  showPrintMap?: boolean;
  editable?: boolean;
  onDeleteStop?: (stopId: string) => void;
  completedStopIds?: Set<string>;
  onToggleStopDone?: (stopId: string) => void;
}

function noop() {}

export function DayCard({
  day,
  itinerary,
  highlightedStopId,
  expandedStopId = null,
  placeInfo = null,
  placeInfoLoading = false,
  stopDetails = null,
  stopDetailsLoading = false,
  stopDetailsError = null,
  selectedAccommodationOptionId = null,
  accommodationDetails = null,
  accommodationDetailsLoading = false,
  accommodationDetailsError = null,
  onHover,
  onClick,
  onAccommodationOptionClick = noop,
  onConfirmAccommodationOption = noop,
  showPrintMap = false,
  editable = false,
  onDeleteStop,
  completedStopIds,
  onToggleStopDone,
}: Props) {
  const accommodationForDay = itinerary.accommodations?.find(
    (acc) => acc.startDay <= day.dayNumber && acc.endDay >= day.dayNumber,
  );
  const firstStopOrigin =
    accommodationForDay?.options.length === 1 ? accommodationForDay.options[0] : undefined;
  const doneCount = completedStopIds
    ? day.stops.filter((s) => completedStopIds.has(s.id)).length
    : 0;

  return (
    <div className="day-card">
      <h3>
        Day {day.dayNumber}: {day.title}
        {doneCount > 0 && (
          <span className={doneCount === day.stops.length ? "day-progress all-done" : "day-progress"}>
            {doneCount}/{day.stops.length} done
          </span>
        )}
      </h3>
      <p className="day-summary">{day.summary}</p>
      {itinerary.accommodations
        ?.filter((acc) => acc.startDay <= day.dayNumber && acc.endDay >= day.dayNumber)
        .map((acc) => (
          <AccommodationCard
            key={acc.id}
            accommodation={acc}
            destination={itinerary.destination}
            selectedOptionId={selectedAccommodationOptionId}
            stopDetails={accommodationDetails}
            stopDetailsLoading={accommodationDetailsLoading}
            stopDetailsError={accommodationDetailsError}
            onOptionClick={onAccommodationOptionClick}
            onConfirmOption={onConfirmAccommodationOption}
          />
        ))}
      {showPrintMap && (
        <div className="print-day-map">
          <MapView
            itinerary={itinerary}
            selectedDay={day.dayNumber}
            highlightedStopId={null}
            flyToStop={null}
            fitSignal={0}
            onStopClick={noop}
            selectedStopId={null}
            placeInfo={null}
            placeInfoLoading={false}
            onCloseDetail={noop}
            selectedAccommodationOptionId={null}
            onAccommodationOptionClick={noop}
            onConfirmAccommodationOption={noop}
          />
        </div>
      )}
      <div className="stop-list">
        {(() => {
          const cards = day.stops.map((stop, i) => {
            const expanded = expandedStopId === stop.id;
            const origin = i > 0 ? day.stops[i - 1] : firstStopOrigin;
            const stopDone = completedStopIds?.has(stop.id) ?? false;
            const card = (
              <StopCard
                key={editable ? undefined : stop.id}
                stop={stop}
                index={i}
                destination={itinerary.destination}
                destinationCenter={itinerary.destinationCenter}
                origin={origin}
                highlighted={highlightedStopId === stop.id}
                expanded={expanded}
                placeInfo={expanded ? placeInfo : null}
                placeInfoLoading={expanded && placeInfoLoading}
                stopDetails={expanded ? stopDetails : null}
                stopDetailsLoading={expanded && stopDetailsLoading}
                stopDetailsError={expanded ? stopDetailsError : null}
                onHover={onHover}
                onClick={onClick}
                onDelete={editable && onDeleteStop ? () => onDeleteStop(stop.id) : undefined}
                done={stopDone}
                onToggleDone={
                  editable && onToggleStopDone ? () => onToggleStopDone(stop.id) : undefined
                }
              />
            );
            if (!editable || !onDeleteStop || !onToggleStopDone) return card;
            return (
              <StopCardShell
                key={stop.id}
                stop={stop}
                done={stopDone}
                onDelete={() => onDeleteStop(stop.id)}
                onToggleDone={() => onToggleStopDone(stop.id)}
              >
                {card}
              </StopCardShell>
            );
          });
          return editable ? (
            <SortableContext items={day.stops.map((s) => s.id)} strategy={verticalListSortingStrategy}>
              {cards}
            </SortableContext>
          ) : (
            cards
          );
        })()}
      </div>
    </div>
  );
}
