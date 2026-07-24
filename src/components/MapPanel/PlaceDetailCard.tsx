import type { PlaceInfo } from "../../api/wikipediaApi";
import { tripAdvisorSearchUrl } from "../../utils/geo";

interface Props {
  stopName: string;
  destination: string;
  loading: boolean;
  place: PlaceInfo | null;
  flagged: boolean;
  onClose: () => void;
}

export function PlaceDetailCard({ stopName, destination, loading, place, flagged, onClose }: Props) {
  return (
    <div className="place-detail-card">
      <button className="place-detail-close" onClick={onClose} aria-label="Close">
        &times;
      </button>
      {loading && <p className="place-detail-loading">Loading {stopName}...</p>}
      {!loading && place && (
        <>
          {place.thumbnailUrl && <img src={place.thumbnailUrl} alt={place.title} />}
          <h4>{place.title}</h4>
          <p>{place.extract}</p>
          <a href={tripAdvisorSearchUrl(stopName, destination)} target="_blank" rel="noopener noreferrer">
            TripAdvisor reviews &rarr;
          </a>
        </>
      )}
      {!loading && !place && (
        <>
          <h4>{stopName}</h4>
          <p className="place-detail-empty">No extra info found for this place.</p>
        </>
      )}
      {flagged && (
        <p className="place-detail-flag">This location is unverified - double-check before relying on it.</p>
      )}
    </div>
  );
}
