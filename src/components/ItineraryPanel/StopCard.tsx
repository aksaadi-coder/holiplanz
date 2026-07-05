import type { Stop, StopDetails } from "../../types";
import type { PlaceInfo } from "../../api/wikipediaApi";
import { directionsUrl, googleMapsUrl, googleSearchUrl, isFlaggedLocation, tripAdvisorSearchUrl } from "../../utils/geo";

interface Props {
  stop: Stop;
  index: number;
  destination: string;
  destinationCenter: { lat: number; lng: number };
  origin?: { lat: number; lng: number };
  highlighted: boolean;
  expanded: boolean;
  placeInfo: PlaceInfo | null;
  placeInfoLoading: boolean;
  stopDetails: StopDetails | null;
  stopDetailsLoading: boolean;
  stopDetailsError: string | null;
  onHover: (stopId: string | null) => void;
  onClick: (stopId: string) => void;
}

export function StopCard({
  stop,
  index,
  destination,
  destinationCenter,
  origin,
  highlighted,
  expanded,
  placeInfo,
  placeInfoLoading,
  stopDetails,
  stopDetailsLoading,
  stopDetailsError,
  onHover,
  onClick,
}: Props) {
  const flagged = isFlaggedLocation(stop, destinationCenter);
  return (
    <div
      className={`stop-card${highlighted ? " highlighted" : ""}${expanded ? " expanded" : ""}`}
      onMouseEnter={() => onHover(stop.id)}
      onMouseLeave={() => onHover(null)}
      onClick={() => onClick(stop.id)}
    >
      <div className="stop-number">{index + 1}</div>
      <div className="stop-body">
        <div className="stop-header">
          <div className="stop-header-text">
            <strong>{stop.name}</strong>
            <span className="stop-time">{stop.timeOfDay}</span>
          </div>
          <button
            className="stop-expand-toggle"
            onClick={(e) => {
              e.stopPropagation();
              onClick(stop.id);
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
        </div>
        <p>{stop.description}</p>
        <div className="stop-tags">
          <span className="tag">{stop.category}</span>
          {flagged && <span className="tag tag-warning">unverified location</span>}
        </div>
        {stop.howToGetThere && <p className="stop-getting-there">&#128663; {stop.howToGetThere}</p>}
        <div className="stop-links">
          <a
            className="stop-link"
            href={googleMapsUrl(stop)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
          >
            View on map &#8599;
          </a>
          <a
            className="stop-link"
            href={directionsUrl(stop, origin)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
          >
            Get directions &#8599;
          </a>
        </div>

        {expanded && (
          <div className="stop-expanded" onClick={(e) => e.stopPropagation()}>
            {(stopDetailsLoading || placeInfoLoading) && (
              <p className="stop-expanded-loading">Gathering more info...</p>
            )}

            {placeInfo?.thumbnailUrl && (
              <img className="stop-expanded-photo" src={placeInfo.thumbnailUrl} alt={placeInfo.title} />
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

                <div className="stop-expanded-cost">
                  <span className="info-tile-label">Estimated cost</span>
                  <strong>{stopDetails.estimatedCost}</strong>
                </div>
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
              <a href={googleSearchUrl(stop.name, destination)} target="_blank" rel="noopener noreferrer">
                Search the web &rarr;
              </a>
              <a href={tripAdvisorSearchUrl(stop.name, destination)} target="_blank" rel="noopener noreferrer">
                TripAdvisor reviews &rarr;
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
