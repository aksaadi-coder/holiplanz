import { MapContainer, TileLayer, Marker } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useReel } from "../../hooks/useReel";
import { ReelShell } from "./ReelShell";
import { StayFeatureIcon } from "../ui/icons";
import { accommodationIcon } from "../MapPanel/mapIcons";

interface Props {
  open: boolean;
  onClose: () => void;
}

const FRAME_COUNT = 3;

const SAMPLE_OPTIONS = [
  { name: "Shinjuku Granbell Hotel", style: "Boutique", area: "Shinjuku", price: "¥18,000/night" },
  { name: "K's House Tokyo", style: "Budget", area: "Asakusa", price: "¥4,500/night" },
];

// Central Tokyo — matches the sample stays above closely enough for a demo pin.
const SAMPLE_POSITION: [number, number] = [35.6938, 139.7034];

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
                <div className="hp-hotel-thumb">
                  <StayFeatureIcon size={22} />
                </div>
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
