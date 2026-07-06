import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Polyline, Tooltip, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { SAMPLE_TRIP } from "../../data/sampleTrip";
import { MARKER_COLOR, numberedIcon } from "../MapPanel/mapIcons";

function FitDay({ dayNumber }: { dayNumber: number }) {
  const map = useMap();

  useEffect(() => {
    const id = setTimeout(() => {
      map.invalidateSize();
      const day = SAMPLE_TRIP.days.find((d) => d.dayNumber === dayNumber);
      if (!day) return;
      const points = day.stops.map((s) => [s.lat, s.lng] as [number, number]);
      map.fitBounds(points, { padding: [36, 36] });
    }, 100);
    return () => clearTimeout(id);
  }, [dayNumber, map]);

  return null;
}

// A real, live Leaflet map of the sample trip — pan, zoom, hover the pins.
export function SpotlightMap() {
  const [selectedDay, setSelectedDay] = useState(1);
  const day = SAMPLE_TRIP.days.find((d) => d.dayNumber === selectedDay) ?? SAMPLE_TRIP.days[0];
  const positions = day.stops.map((s) => [s.lat, s.lng] as [number, number]);

  return (
    <div className="spotlight-map-demo">
      <div className="spotlight-day-pills">
        {SAMPLE_TRIP.days.map((d) => (
          <button
            key={d.dayNumber}
            className={d.dayNumber === selectedDay ? "active" : ""}
            onClick={() => setSelectedDay(d.dayNumber)}
          >
            Day {d.dayNumber}
          </button>
        ))}
      </div>
      <div className="spotlight-map">
        <MapContainer
          center={[SAMPLE_TRIP.destinationCenter.lat, SAMPLE_TRIP.destinationCenter.lng]}
          zoom={13}
          scrollWheelZoom
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap contributors"
          />
          <FitDay dayNumber={selectedDay} />
          <Polyline positions={positions} pathOptions={{ color: MARKER_COLOR, weight: 3, opacity: 0.7 }} />
          {day.stops.map((stop, i) => (
            <Marker key={stop.id} position={[stop.lat, stop.lng]} icon={numberedIcon(i + 1, false, false)}>
              <Tooltip direction="top" offset={[0, -14]} opacity={1}>
                <div className="stop-tooltip">
                  <strong>{stop.name}</strong>
                  <span className="stop-tooltip-meta">
                    {stop.timeOfDay} &middot; {stop.category}
                  </span>
                  <p>{stop.description}</p>
                </div>
              </Tooltip>
            </Marker>
          ))}
        </MapContainer>
      </div>
      <p className="spotlight-map-hint">This is the real map — pan, zoom, and tap the numbered pins.</p>
    </div>
  );
}
