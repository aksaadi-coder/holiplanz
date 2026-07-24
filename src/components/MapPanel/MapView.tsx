import { Fragment, useEffect, useRef } from "react";
import type L from "leaflet";
import { MapContainer, TileLayer, Marker, Polyline, Tooltip, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { AccommodationOption, Day, Itinerary, Stop } from "../../types";
import type { PlaceInfo } from "../../api/wikipediaApi";
import { MARKER_COLOR, accommodationIcon, numberedIcon } from "./mapIcons";
import { isFlaggedLocation } from "../../utils/geo";
import { PlaceDetailCard } from "./PlaceDetailCard";
import { AccommodationOptionCard } from "../AccommodationOptionCard";

const STOP_ZOOM = 17;

interface Props {
  itinerary: Itinerary;
  selectedDay: number | "all";
  highlightedStopId: string | null;
  flyToStop: Stop | null;
  fitSignal: number;
  onStopClick: (stopId: string) => void;
  selectedStopId: string | null;
  placeInfo: PlaceInfo | null;
  placeInfoLoading: boolean;
  onCloseDetail: () => void;
  selectedAccommodationOptionId: string | null;
  onAccommodationOptionClick: (option: AccommodationOption) => void;
  onConfirmAccommodationOption: (accommodationId: string, optionId: string) => void;
  completedStopIds?: Set<string>;
}

function FitBounds({
  days,
  selectedDay,
  fitSignal,
}: {
  days: Day[];
  selectedDay: number | "all";
  fitSignal: number;
}) {
  const map = useMap();

  useEffect(() => {
    const id = setTimeout(() => {
      map.invalidateSize();
      const visibleDays = selectedDay === "all" ? days : days.filter((d) => d.dayNumber === selectedDay);
      const points = visibleDays.flatMap((d) => d.stops.map((s) => [s.lat, s.lng] as [number, number]));
      if (points.length === 0) return;
      if (points.length === 1) {
        map.setView(points[0], 14);
        return;
      }
      map.fitBounds(points, { padding: [40, 40] });
    }, 50);
    return () => clearTimeout(id);
  }, [days, selectedDay, fitSignal, map]);

  return null;
}

function FlyToStop({ stop }: { stop: Stop | null }) {
  const map = useMap();

  useEffect(() => {
    if (!stop) return;
    map.flyTo([stop.lat, stop.lng], STOP_ZOOM, { duration: 0.75 });
  }, [stop, map]);

  return null;
}

function InvalidateSizeOnMount() {
  const map = useMap();

  useEffect(() => {
    const id = setTimeout(() => map.invalidateSize(), 100);
    return () => clearTimeout(id);
  }, [map]);

  return null;
}

export function MapView({
  itinerary,
  selectedDay,
  highlightedStopId,
  flyToStop,
  fitSignal,
  onStopClick,
  selectedStopId,
  placeInfo,
  placeInfoLoading,
  onCloseDetail,
  selectedAccommodationOptionId,
  onAccommodationOptionClick,
  onConfirmAccommodationOption,
  completedStopIds,
}: Props) {
  const visibleDays =
    selectedDay === "all" ? itinerary.days : itinerary.days.filter((d) => d.dayNumber === selectedDay);
  const showRoutes = selectedDay !== "all";
  const markerRefs = useRef(new Map<string, L.Marker>());
  const accommodationMarkerRefs = useRef(new Map<string, L.Marker>());

  useEffect(() => {
    markerRefs.current.forEach((marker, id) => {
      if (id === selectedStopId) {
        if (marker.isPopupOpen()) {
          marker.getPopup()?.update();
        } else {
          marker.openPopup();
        }
      } else {
        marker.closePopup();
      }
    });
  }, [selectedStopId, placeInfo, placeInfoLoading]);

  useEffect(() => {
    accommodationMarkerRefs.current.forEach((marker, id) => {
      if (id === selectedAccommodationOptionId) {
        if (marker.isPopupOpen()) {
          marker.getPopup()?.update();
        } else {
          marker.openPopup();
        }
      } else {
        marker.closePopup();
      }
    });
  }, [selectedAccommodationOptionId]);

  return (
    <MapContainer
      center={[itinerary.destinationCenter.lat, itinerary.destinationCenter.lng]}
      zoom={13}
      scrollWheelZoom
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        attribution="&copy; <a href='https://carto.com/attributions'>CARTO</a> &copy; OpenStreetMap contributors"
        subdomains="abcd"
        maxZoom={19}
      />
      <FitBounds days={itinerary.days} selectedDay={selectedDay} fitSignal={fitSignal} />
      <FlyToStop stop={flyToStop} />
      <InvalidateSizeOnMount />
      {itinerary.accommodations
        ?.filter(
          (acc) => selectedDay === "all" || (acc.startDay <= selectedDay && acc.endDay >= selectedDay),
        )
        .flatMap((acc) => {
          const nights = acc.endDay - acc.startDay + 1;
          const dateRangeLabel = `Day ${acc.startDay}${
            acc.endDay !== acc.startDay ? `-${acc.endDay}` : ""
          } (${nights} night${nights === 1 ? "" : "s"})`;
          const canConfirm = acc.options.length > 1;
          return acc.options.map((option) => {
            const expanded = option.id === selectedAccommodationOptionId;
            return (
              <Marker
                key={option.id}
                ref={(instance) => {
                  if (instance) {
                    accommodationMarkerRefs.current.set(option.id, instance);
                  } else {
                    accommodationMarkerRefs.current.delete(option.id);
                  }
                }}
                position={[option.lat, option.lng]}
                icon={accommodationIcon("H", expanded)}
                eventHandlers={{ click: () => onAccommodationOptionClick(option) }}
              >
                <Tooltip direction="top" offset={[0, -14]} opacity={1}>
                  <div className="stop-tooltip">
                    <strong>{option.name}</strong>
                    <span className="stop-tooltip-meta">{option.style} stay</span>
                  </div>
                </Tooltip>
                <Popup
                  className="place-detail-popup accommodation-popup"
                  closeButton={false}
                  minWidth={260}
                  maxWidth={280}
                >
                  <AccommodationOptionCard
                    option={option}
                    destination={itinerary.destination}
                    dateRangeLabel={dateRangeLabel}
                    expanded={false}
                    stopDetails={null}
                    stopDetailsLoading={false}
                    stopDetailsError={null}
                    onClick={() => onAccommodationOptionClick(option)}
                    onClose={() => onAccommodationOptionClick(option)}
                    onConfirm={
                      canConfirm ? () => onConfirmAccommodationOption(acc.id, option.id) : undefined
                    }
                  />
                </Popup>
              </Marker>
            );
          });
        })}
      {visibleDays.map((day) => {
        const positions = day.stops.map((s) => [s.lat, s.lng] as [number, number]);
        return (
          <Fragment key={day.dayNumber}>
            {showRoutes && positions.length > 1 && (
              <Polyline
                positions={positions}
                pathOptions={{ color: MARKER_COLOR, weight: 3, opacity: 0.6, dashArray: "2 10", lineCap: "round" }}
              />
            )}
            {day.stops.map((stop, i) => {
              const flagged = isFlaggedLocation(stop, itinerary.destinationCenter);
              return (
                <Marker
                  key={stop.id}
                  ref={(instance) => {
                    if (instance) {
                      markerRefs.current.set(stop.id, instance);
                    } else {
                      markerRefs.current.delete(stop.id);
                    }
                  }}
                  position={[stop.lat, stop.lng]}
                  icon={numberedIcon(
                    i + 1,
                    highlightedStopId === stop.id,
                    flagged,
                    completedStopIds?.has(stop.id) ?? false,
                  )}
                  eventHandlers={{ click: () => onStopClick(stop.id) }}
                >
                  <Tooltip direction="top" offset={[0, -14]} opacity={1}>
                    <div className="stop-tooltip">
                      <strong>{stop.name}</strong>
                      <span className="stop-tooltip-meta">
                        {stop.timeOfDay} &middot; {stop.category}
                      </span>
                      <p>{stop.description}</p>
                      {flagged && <em>Location unverified</em>}
                    </div>
                  </Tooltip>
                  {stop.id === selectedStopId && (
                    <Popup className="place-detail-popup" closeButton={false} minWidth={280} maxWidth={300}>
                      <PlaceDetailCard
                        stopName={stop.name}
                        destination={itinerary.destination}
                        loading={placeInfoLoading}
                        place={placeInfo}
                        flagged={flagged}
                        onClose={onCloseDetail}
                      />
                    </Popup>
                  )}
                </Marker>
              );
            })}
          </Fragment>
        );
      })}
    </MapContainer>
  );
}
