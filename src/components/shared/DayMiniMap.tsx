import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, Polyline } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { SharedStop } from "../../utils/shareLink";
import { numberedIcon } from "../MapPanel/mapIcons";
import { CORAL } from "../../styles/palette";

interface Props {
  stops: SharedStop[];
  /** Where they sleep that night, marked in coral. */
  hotel?: [number, number];
}

/** Stay marker — the app's accommodation pin in coral, since on a page that
 *  belongs to no one reading it, the bed is the one place worth singling out. */
function stayIcon(): L.DivIcon {
  return L.divIcon({
    className: "accommodation-marker",
    html: `<div class="accommodation-marker-inner" style="width:26px;height:26px;background:${CORAL};"><span class="accommodation-marker-label">Stay</span></div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
  });
}

/**
 * The map above each day on a shared trip.
 *
 * Numbered pins rather than named ones: the names are in the list directly
 * underneath, in the same order, and permanent labels on a map this size
 * collide with each other the moment a day has more than a couple of stops.
 *
 * Nothing here is interactive. A guest is reading, not planning, and a map
 * that pans swallows the page scroll on a phone — the one thing this page
 * has to get right.
 */
export function DayMiniMap({ stops, hotel }: Props) {
  const host = useRef<HTMLDivElement>(null);
  // A fortnight's trip is a fortnight's maps. They're built as each comes
  // into view, so opening a link costs one map, not fourteen.
  const [live, setLive] = useState(false);

  useEffect(() => {
    const node = host.current;
    if (!node || live) return;
    if (typeof IntersectionObserver === "undefined") {
      setLive(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setLive(true);
          observer.disconnect();
        }
      },
      { rootMargin: "400px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [live]);

  const route = stops
    .filter((s) => located(s.a, s.o))
    .map((s) => [s.a, s.o] as [number, number]);
  const stay = hotel && located(hotel[0], hotel[1]) ? hotel : null;
  const points = stay ? [...route, stay] : route;
  // No coordinates, no map. Better a day of plain rows than an empty box that
  // looks like something failed to load.
  if (points.length === 0) return null;

  return (
    <div className="hp-shared-map" ref={host}>
      {live && (
        <MapContainer
          bounds={L.latLngBounds(points).pad(0.15)}
          // Every way in is off: no drag, no zoom, no keyboard. See above.
          dragging={false}
          scrollWheelZoom={false}
          doubleClickZoom={false}
          touchZoom={false}
          keyboard={false}
          zoomControl={false}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            attribution="&copy; <a href='https://carto.com/attributions'>CARTO</a> &copy; OpenStreetMap contributors"
            subdomains="abcd"
            maxZoom={19}
          />
          {route.length > 1 && (
            <Polyline
              positions={route}
              pathOptions={{ color: "#161410", weight: 1.5, opacity: 0.45, dashArray: "5 5" }}
            />
          )}
          {route.map((position, i) => (
            <Marker key={`${position[0]}-${position[1]}-${i}`} position={position} icon={numberedIcon(i + 1, false, false)} />
          ))}
          {stay && <Marker position={stay} icon={stayIcon()} />}
        </MapContainer>
      )}
    </div>
  );
}

/** Finite, in range, and not the null island — a stop the planner couldn't
 *  place comes back as 0,0, and one of those drags the whole day's bounds
 *  into the Atlantic. */
function located(lat: number, lng: number): boolean {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    Math.abs(lat) <= 90 &&
    Math.abs(lng) <= 180 &&
    !(lat === 0 && lng === 0)
  );
}
