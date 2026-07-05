import { useState } from "react";
import type { Itinerary } from "../types";
import { BrandLogo } from "./BrandLogo";

interface Props {
  itinerary: Itinerary;
  saved: boolean;
  onStartOver: () => void;
  onToggleSave: () => void;
  onPreviewPdf: () => void;
  onSharePdf: () => void;
  onShowDestinationInfo: () => void;
  onAddAccommodation: () => void;
}

export function Header({
  itinerary,
  saved,
  onStartOver,
  onToggleSave,
  onPreviewPdf,
  onSharePdf,
  onShowDestinationInfo,
  onAddAccommodation,
}: Props) {
  const hasAccommodation = (itinerary.accommodations?.length ?? 0) > 0;
  const [showMore, setShowMore] = useState(false);

  function handleSecondary(action: () => void) {
    setShowMore(false);
    action();
  }

  return (
    <header className="trip-header">
      <div>
        <span className="app-brand">
          <BrandLogo />
          Holiplanz
        </span>
        <h1>{itinerary.tripTitle}</h1>
        <p className="trip-destination">{itinerary.destination}</p>
      </div>
      <div className="trip-header-actions">
        <button className="start-over" onClick={onStartOver}>
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path d="M3 11.5 12 4l9 7.5" />
            <path d="M5.5 10v9a1 1 0 0 0 1 1H9v-5.5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1V20h2.5a1 1 0 0 0 1-1v-9" />
          </svg>
          Home
        </button>
        <button className={saved ? "save-trip saved" : "save-trip"} onClick={onToggleSave}>
          {saved ? "Saved ✓" : "Save trip"}
        </button>
        <button
          className="trip-header-more-toggle trip-info-button"
          onClick={() => setShowMore((s) => !s)}
          aria-label="More actions"
          aria-expanded={showMore}
        >
          &#8943;
        </button>
        <div className={showMore ? "trip-header-secondary open" : "trip-header-secondary"}>
          <button className="trip-info-button" onClick={() => handleSecondary(onShowDestinationInfo)}>
            <svg
              className="trip-info-icon"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="11" x2="12" y2="16" />
              <circle cx="12" cy="7.2" r="1.4" fill="currentColor" stroke="none" />
            </svg>
            Trip info
          </button>
          {!hasAccommodation && (
            <button className="trip-info-button" onClick={() => handleSecondary(onAddAccommodation)}>
              <svg
                className="accommodation-add-icon"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M2 20v-7a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v7" />
                <path d="M2 13V7a2 2 0 0 1 2-2h6v6" />
                <path d="M12 13h10" />
              </svg>
              Add accommodation
            </button>
          )}
          <button className="print-trip" onClick={() => handleSecondary(onPreviewPdf)}>
            Preview PDF
          </button>
          <button className="print-trip" onClick={() => handleSecondary(onSharePdf)}>
            Share PDF
          </button>
        </div>
      </div>
    </header>
  );
}
