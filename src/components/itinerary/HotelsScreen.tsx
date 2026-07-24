import { useEffect, useState } from "react";
import type { Accommodation, AccommodationOption } from "../../types";
import { fetchPlaceInfo } from "../../api/wikipediaApi";
import { StayFeatureIcon } from "../ui/icons";

interface Props {
  open: boolean;
  accommodation: Accommodation | undefined;
  destination: string;
  onClose: () => void;
  onOpenDetail: (option: AccommodationOption) => void;
  onConfirm: (accommodationId: string, optionId: string) => void;
}

/** Row thumbnail — a Wikipedia photo of this specific hotel/hostel, or a
 *  neutral icon when none is found. Same lookup/fallback as HotelDetailCard,
 *  so the look is consistent whether you're browsing options or viewing one
 *  in detail. */
function HotelThumb({ name, destination }: { name: string; destination: string }) {
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
      {!photo && <StayFeatureIcon size={26} />}
    </div>
  );
}

/** Full-screen "Where you'll stay" — the stay's options as selectable rows. */
export function HotelsScreen({ open, accommodation, destination, onClose, onOpenDetail, onConfirm }: Props) {
  const [selected, setSelected] = useState<string | null>(null);

  // Default the selection when the screen opens. A lazy initializer can't be
  // used because this component mounts before the trip has any accommodation.
  useEffect(() => {
    if (open && accommodation && !accommodation.options.some((o) => o.id === selected)) {
      setSelected(accommodation.options[0]?.id ?? null);
    }
  }, [open, accommodation, selected]);

  if (!open || !accommodation) return null;

  const nights = Math.max(1, accommodation.endDay - accommodation.startDay + 1);
  const area = accommodation.options[0]?.area;

  return (
    <div className="hp-fullscreen hp-hotels">
      <div className="hp-hotels-scroll">
        <button type="button" className="hp-back-link" onClick={onClose}>
          ‹ Itinerary
        </button>
        <h1>Where you'll stay</h1>
        <p className="hp-label hp-hotels-sub">
          {area ? `Staying near ${area} · ` : ""}
          {nights} {nights === 1 ? "night" : "nights"}
        </p>

        <div className="hp-hotels-list">
          {accommodation.options.map((option) => (
            <div
              key={option.id}
              className={`hp-hotel-row ${selected === option.id ? "is-selected" : ""}`.trim()}
              onClick={() => {
                setSelected(option.id);
                onOpenDetail(option);
              }}
            >
              <HotelThumb name={option.name} destination={destination} />
              <span className="hp-hotel-info">
                <b>{option.name}</b>
                <span className="hp-hotel-sub">
                  {option.style} · {option.area}
                </span>
                <b className="hp-hotel-price">{option.estimatedPricePerNight}</b>
              </span>
              <span
                className={`hp-radio ${selected === option.id ? "is-on" : ""}`.trim()}
                aria-hidden
              />
            </div>
          ))}
        </div>

        <p className="hp-hotels-note">
          Tap a stay to see the detail, or pick one and add it to your trip.
        </p>
      </div>

      <button
        type="button"
        className="hp-hotels-add"
        disabled={!selected}
        onClick={() => {
          if (selected) {
            onConfirm(accommodation.id, selected);
            onClose();
          }
        }}
      >
        Add to trip
      </button>
    </div>
  );
}
