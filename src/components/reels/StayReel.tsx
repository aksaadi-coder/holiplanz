import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useReel } from "../../hooks/useReel";
import { ReelShell } from "./ReelShell";
import { StayFeatureIcon } from "../ui/icons";
import { accommodationIcon } from "../MapPanel/mapIcons";
import { fetchPlaceInfo } from "../../api/wikipediaApi";

interface Props {
  open: boolean;
  onClose: () => void;
}

const FRAME_COUNT = 3;

const SAMPLE_DESTINATION = "Tokyo, Japan";

// Two real hotels, each with its own Wikipedia page, so both get a real
// thumbnail. Verified against the actual lookup+relevance check (see
// wikipediaApi.ts) rather than assumed — a name that merely contains the
// city (e.g. "K's House Tokyo") can falsely match an unrelated Tokyo page
// instead of its own, or return no match at all.
const SAMPLE_OPTIONS = [
  { name: "Hotel Okura Tokyo", style: "Luxury", area: "Minato", price: "¥68,000/night" },
  { name: "Keio Plaza Hotel Tokyo", style: "Mid-range", area: "Shinjuku", price: "¥22,000/night" },
];

// Central Tokyo — matches the sample stays above closely enough for a demo pin.
const SAMPLE_POSITION: [number, number] = [35.6938, 139.7034];

/** Same lookup/fallback as HotelsScreen's HotelThumb — a real Wikipedia photo
 *  of this specific hotel, or the neutral icon when none is found. */
function ReelHotelThumb({ name, destination }: { name: string; destination: string }) {
  const [photo, setPhoto] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setPhoto(null);
    fetchPlaceInfo(name, destination)
      .then((info) => {
        if (!cancelled) setPhoto(info?.thumbnailUrl ?? null);
      })
      .catch(() => {
        if (!cancelled) setPhoto(null);
      });
    return () => {
      cancelled = true;
    };
  }, [name, destination]);

  return (
    <div className="hp-hotel-thumb" style={photo ? { backgroundImage: `url(${photo})` } : undefined}>
      {!photo && <StayFeatureIcon size={22} />}
    </div>
  );
}

/**
 * "Stay" feature reel — real hotel-row styling, the actual (inert) Leaflet
 * map used on the itinerary/hotel-detail screens, and the real Booking.com/
 * TripAdvisor link row, all with sample data.
 */
export function StayReel({ open, onClose }: Props) {
  const { frame, progress, handleTap } = useReel({ open, frameCount: FRAME_COUNT, onClose });

  return (
    <ReelShell
      open={open}
      onClose={onClose}
      title="Stay"
      frameCount={FRAME_COUNT}
      frame={frame}
      progress={progress}
      onTap={handleTap}
    >
      {frame === 0 && (
        <div className="hp-reel-frame" key="0">
          <div className="hp-reel-hotels">
            {SAMPLE_OPTIONS.map((option, i) => (
              <div
                className={`hp-hotel-row hp-reel-hotel-row ${i === 0 ? "is-selected" : ""}`.trim()}
                key={option.name}
                style={{ animationDelay: `${i * 0.12}s` }}
              >
                <ReelHotelThumb name={option.name} destination={SAMPLE_DESTINATION} />
                <span className="hp-hotel-info">
                  <b>{option.name}</b>
                  <span className="hp-hotel-sub">
                    {option.style} · {option.area}
                  </span>
                  <b className="hp-hotel-price">{option.price}</b>
                </span>
                <span className={`hp-radio ${i === 0 ? "is-on" : ""}`.trim()} aria-hidden />
              </div>
            ))}
          </div>
          <p className="hp-reel-headline">Real stays, not guesses</p>
          <p className="hp-reel-caption">Budget to boutique, matched to your trip</p>
        </div>
      )}

      {frame === 1 && (
        <div className="hp-reel-frame" key="1">
          <div className="hp-hd-loc hp-reel-map">
            <MapContainer
              center={SAMPLE_POSITION}
              zoom={14}
              zoomControl={false}
              dragging={false}
              scrollWheelZoom={false}
              doubleClickZoom={false}
              touchZoom={false}
              boxZoom={false}
              keyboard={false}
              attributionControl={false}
              style={{ height: "100%", width: "100%" }}
            >
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                subdomains="abcd"
              />
              <Marker position={SAMPLE_POSITION} icon={accommodationIcon("H", true)} />
            </MapContainer>
          </div>
          <p className="hp-reel-headline">See exactly where you'll stay</p>
          <p className="hp-reel-caption">Every option, pinned on the map</p>
        </div>
      )}

      {frame === 2 && (
        <div className="hp-reel-frame" key="2">
          <div className="hp-cd-links hp-reel-hotel-links">
            <a href="#" onClick={(e) => e.preventDefault()}>
              Booking.com →
            </a>
            <a href="#" onClick={(e) => e.preventDefault()}>
              TripAdvisor reviews →
            </a>
          </div>
          <p className="hp-reel-headline">Compare and book instantly</p>
          <p className="hp-reel-caption">Real photos, real reviews, one tap away</p>
        </div>
      )}
    </ReelShell>
  );
}
