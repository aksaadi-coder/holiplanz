import { useEffect, useRef, useState } from "react";
import type { Stop, StopDetails } from "../../types";
import { fetchStopDetails } from "../../api/itineraryApi";
import { fetchPlaceInfo, type PlaceInfo } from "../../api/wikipediaApi";
import { directionsUrl, googleMapsUrl, tripAdvisorSearchUrl } from "../../utils/geo";
import { FloatingCard, CloseCircle, StampRing } from "../ui/primitives";
import { TransitIcon } from "../ui/icons";

interface Props {
  stop: Stop | null;
  /** 1-based position within its day — shown in the black badge. */
  index: number;
  time: string;
  destination: string;
  onClose: () => void;
}

/**
 * "Card detail" floating card — opened by tapping a stop on the itinerary.
 * Reuses the existing stop-details lookup and Wikipedia's photo/summary
 * (but links out to TripAdvisor for reviews, not the Wikipedia page).
 */
export function CardDetail({ stop, index, time, destination, onClose }: Props) {
  const [details, setDetails] = useState<StopDetails | null>(null);
  const [place, setPlace] = useState<PlaceInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cache = useRef(new Map<string, StopDetails>());
  const requestRef = useRef(0);

  useEffect(() => {
    if (!stop) return;
    const requestId = ++requestRef.current;
    setError(null);
    setPlace(null);

    fetchPlaceInfo(stop.name, destination)
      .then((info) => requestRef.current === requestId && setPlace(info))
      .catch(() => {});

    const cached = cache.current.get(stop.id);
    if (cached) {
      setDetails(cached);
      setLoading(false);
      return;
    }

    setDetails(null);
    setLoading(true);
    fetchStopDetails(destination, stop.name, stop.category)
      .then((d) => {
        if (requestRef.current !== requestId) return;
        cache.current.set(stop.id, d);
        setDetails(d);
      })
      .catch((err) => {
        if (requestRef.current !== requestId) return;
        setError(err instanceof Error ? err.message : "Couldn't load more info right now.");
      })
      .finally(() => requestRef.current === requestId && setLoading(false));
  }, [stop, destination]);

  return (
    <FloatingCard open={stop !== null} onClose={onClose}>
      {stop && (
        <>
          <div className="hp-cd-head">
            <span className="hp-cd-num">{index}</span>
            <div className="hp-cd-title">
              <b>{stop.name}</b>
              <div>
                {time} · {stop.category}
              </div>
            </div>
            <CloseCircle onClose={onClose} />
          </div>

          {place?.thumbnailUrl && (
            <img className="hp-cd-photo" src={place.thumbnailUrl} alt={place.title ?? stop.name} />
          )}

          <p className="hp-cd-blurb">{details?.overview ?? stop.description}</p>

          {stop.howToGetThere && (
            <>
              <p className="hp-label">How to get there</p>
              <div className="hp-cd-transit">
                <TransitIcon size={17} />
                {stop.howToGetThere}
              </div>
            </>
          )}

          {/* The card opens on what the itinerary already knows and fills in
              the rest from a second request. That wait used to be one line of
              grey text, easily read as the end of the card — so it now says so
              with a moving ring, and stands in for the sections on their way at
              roughly the height they'll take, which also keeps the card from
              lurching when they land. */}
          {loading && (
            <div className="hp-cd-loading" role="status">
              <span className="hp-cd-loading-head">
                <StampRing size={17} spinning />
                Gathering more info…
              </span>
              <span className="hp-cd-skeleton" style={{ width: "42%" }} />
              <span className="hp-cd-skeleton" style={{ width: "88%" }} />
              <span className="hp-cd-skeleton" style={{ width: "72%" }} />
            </div>
          )}

          {details && (
            <>
              <div className="hp-cd-stat">
                <span className="hp-label">Estimated cost</span>
                <b>{details.estimatedCost}</b>
              </div>

              <p className="hp-label">Highlights</p>
              <ul className="hp-cd-list">
                {details.highlights.map((h) => (
                  <li key={h}>{h}</li>
                ))}
              </ul>

              <p className="hp-label">Good to know</p>
              <ul className="hp-cd-list">
                {details.tips.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </>
          )}

          {error && <p className="hp-cd-error">{error}</p>}

          <div className="hp-cd-links">
            <a href={googleMapsUrl(stop)} target="_blank" rel="noopener noreferrer">
              View on map →
            </a>
            <a href={directionsUrl(stop)} target="_blank" rel="noopener noreferrer">
              Get directions →
            </a>
            {stop.category !== "transport" && (
              <a href={tripAdvisorSearchUrl(stop.name, destination)} target="_blank" rel="noopener noreferrer">
                TripAdvisor reviews →
              </a>
            )}
          </div>
        </>
      )}
    </FloatingCard>
  );
}
