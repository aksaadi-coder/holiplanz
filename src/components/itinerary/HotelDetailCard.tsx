import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { AccommodationOption } from "../../types";
import { FloatingCard, CloseCircle } from "../ui/primitives";
import { StayFeatureIcon } from "../ui/icons";
import { fetchPlaceInfo } from "../../api/wikipediaApi";
import { accommodationIcon } from "../MapPanel/mapIcons";
import { googleMapsUrl, bookingSearchUrl, tripAdvisorSearchUrl } from "../../utils/geo";

interface Props {
  option: AccommodationOption | null;
  destination: string;
  /** True when this option is already the confirmed stay. */
  confirmed: boolean;
  onClose: () => void;
  onChoose: () => void;
}

/** "Hotel detail" floating card — header photo, stat row, blurb, location,
 *  and links out to Booking.com / TripAdvisor for reviews and prices. */
export function HotelDetailCard({ option, destination, confirmed, onClose, onChoose }: Props) {
  const [photo, setPhoto] = useState<string | null>(null);

  useEffect(() => {
    setPhoto(null);
    if (!option) return;
    let cancelled = false;
    fetchPlaceInfo(option.name, destination)
      .then((info) => {
        if (!cancelled) setPhoto(info?.thumbnailUrl ?? null);
      })
      .catch(() => {
        if (!cancelled) setPhoto(null);
      });
    return () => {
      cancelled = true;
    };
  }, [option?.id, option?.name, destination]);

  return (
    <FloatingCard open={option !== null} onClose={onClose}>
      {option && (
        <div className="hp-hd">
          <div className="hp-hd-hero" style={photo ? { backgroundImage: `url(${photo})` } : undefined}>
            {!photo && <StayFeatureIcon size={44} />}
            <CloseCircle onClose={onClose} />
          </div>

          <div className="hp-hd-body">
            <div className="hp-hd-title">
              <b>{option.name}</b>
              <div>
                {option.style} · {option.area}
              </div>
            </div>

            <div className="hp-hd-stats">
              <span>
                <span className="hp-label">Per night</span>
                <b>{option.estimatedPricePerNight}</b>
              </span>
              {option.rating && (
                <span>
                  <span className="hp-label">Rating</span>
                  <b>{option.rating}</b>
                </span>
              )}
              {option.walkToStation && (
                <span>
                  <span className="hp-label">Walk to station</span>
                  <b>{option.walkToStation}</b>
                </span>
              )}
            </div>

            <p className="hp-hd-blurb">{option.description}</p>

            <p className="hp-label">Location</p>
            <div className="hp-hd-loc">
              <MapContainer
                center={[option.lat, option.lng]}
                zoom={15}
                scrollWheelZoom
                style={{ height: "100%", width: "100%" }}
              >
                <TileLayer
                  url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                  attribution="&copy; <a href='https://carto.com/attributions'>CARTO</a> &copy; OpenStreetMap contributors"
                  subdomains="abcd"
                  maxZoom={19}
                />
                <Marker position={[option.lat, option.lng]} icon={accommodationIcon("H", true)} />
              </MapContainer>
            </div>
            <a
              className="hp-hd-maplink"
              href={googleMapsUrl({ lat: option.lat, lng: option.lng })}
              target="_blank"
              rel="noopener noreferrer"
            >
              Show on map ↗
            </a>

            <div className="hp-cd-links hp-hd-links">
              <a href={bookingSearchUrl(option.name, destination)} target="_blank" rel="noopener noreferrer">
                Booking.com →
              </a>
              <a href={tripAdvisorSearchUrl(option.name, destination)} target="_blank" rel="noopener noreferrer">
                TripAdvisor reviews →
              </a>
            </div>

            <button type="button" className="hp-hd-cta" onClick={onChoose} disabled={confirmed}>
              {confirmed ? "Your confirmed stay" : "Choose this stay"}
            </button>
          </div>
        </div>
      )}
    </FloatingCard>
  );
}
