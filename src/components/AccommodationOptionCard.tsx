import { useEffect, useState } from "react";
import type { AccommodationOption, StopDetails } from "../types";
import { fetchPlaceInfo, type PlaceInfo } from "../api/wikipediaApi";
import { airbnbSearchUrl, bookingSearchUrl, googleSearchUrl } from "../utils/geo";

interface Props {
  option: AccommodationOption;
  destination: string;
  dateRangeLabel?: string;
  expanded: boolean;
  stopDetails: StopDetails | null;
  stopDetailsLoading: boolean;
  stopDetailsError: string | null;
  onClick: () => void;
  onClose?: () => void;
  onConfirm?: () => void;
}

export function AccommodationOptionCard({
  option,
  destination,
  dateRangeLabel,
  expanded,
  stopDetails,
  stopDetailsLoading,
  stopDetailsError,
  onClick,
  onClose,
  onConfirm,
}: Props) {
  const isConfirmed = option.style.toLowerCase() === "confirmed";
  const [placeInfo, setPlaceInfo] = useState<PlaceInfo | null>(null);
  const [placeInfoLoading, setPlaceInfoLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setPlaceInfoLoading(true);
    setPlaceInfo(null);
    fetchPlaceInfo(option.name, destination)
      .then((info) => {
        if (!cancelled) setPlaceInfo(info);
      })
      .catch(() => {
        if (!cancelled) setPlaceInfo(null);
      })
      .finally(() => {
        if (!cancelled) setPlaceInfoLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [option.id, option.name, destination]);

  return (
    <div
      className={`accommodation-option-card${expanded ? " expanded" : ""}`}
      onClick={onClick}
    >
      {onClose && (
        <button
          className="place-detail-close"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          aria-label="Close"
        >
          &times;
        </button>
      )}
      {placeInfo?.thumbnailUrl ? (
        <img className="accommodation-option-photo" src={placeInfo.thumbnailUrl} alt={option.name} />
      ) : (
        <div className="accommodation-option-photo accommodation-option-photo-placeholder">
          {!placeInfoLoading && (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M2 20v-7a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v7" />
              <path d="M2 13V7a2 2 0 0 1 2-2h6v6" />
              <path d="M12 13h10" />
              <path d="M2 20v-3" />
              <path d="M22 20v-3" />
            </svg>
          )}
        </div>
      )}
      <div className="accommodation-option-body">
        <div className="accommodation-option-header">
          <div className="accommodation-option-title">
            <strong>{option.name}</strong>
            <span className={`accommodation-option-style${isConfirmed ? " confirmed" : ""}`}>
              {isConfirmed ? "✓ Confirmed" : option.style}
            </span>
          </div>
          {!onClose && (
            <button
              className="stop-expand-toggle"
              onClick={(e) => {
                e.stopPropagation();
                onClick();
              }}
              aria-label={expanded ? "Collapse details" : "Expand details"}
              aria-expanded={expanded}
            >
              <svg
                className={expanded ? "chevron chevron-open" : "chevron"}
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                aria-hidden="true"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
          )}
        </div>
        {dateRangeLabel && <span className="accommodation-card-meta">{dateRangeLabel}</span>}
        <span className="accommodation-card-meta">{option.area}</span>
        <p className="accommodation-option-description">{option.description}</p>
        <span className="accommodation-card-price">{option.estimatedPricePerNight} (approx.)</span>
        <div className="accommodation-option-actions">
          <div className="accommodation-option-links">
            <a
              href={bookingSearchUrl(option.name, destination)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
            >
              Search on Booking.com &rarr;
            </a>
            <a
              href={airbnbSearchUrl(option.name, destination)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
            >
              Search on Airbnb &rarr;
            </a>
          </div>
          {onConfirm && (
            <button
              className="accommodation-confirm-button"
              onClick={(e) => {
                e.stopPropagation();
                onConfirm();
              }}
            >
              Confirm this stay
            </button>
          )}
        </div>

        {expanded && (
          <div className="stop-expanded" onClick={(e) => e.stopPropagation()}>
            {(stopDetailsLoading || placeInfoLoading) && (
              <p className="stop-expanded-loading">Gathering more info...</p>
            )}

            {stopDetails && (
              <>
                <p className="stop-expanded-overview">{stopDetails.overview}</p>

                <h5>Highlights</h5>
                <ul className="stop-expanded-list">
                  {stopDetails.highlights.map((h) => (
                    <li key={h}>{h}</li>
                  ))}
                </ul>

                <h5>Good to know</h5>
                <ul className="stop-expanded-list">
                  {stopDetails.tips.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
              </>
            )}

            {stopDetailsError && <p className="stop-expanded-error">{stopDetailsError}</p>}

            {!placeInfoLoading && placeInfo?.extract && (
              <p className="stop-expanded-wiki">{placeInfo.extract}</p>
            )}

            <div className="stop-expanded-links">
              {placeInfo?.pageUrl && (
                <a href={placeInfo.pageUrl} target="_blank" rel="noopener noreferrer">
                  Wikipedia &rarr;
                </a>
              )}
              <a href={googleSearchUrl(option.name, destination)} target="_blank" rel="noopener noreferrer">
                Search the web &rarr;
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
