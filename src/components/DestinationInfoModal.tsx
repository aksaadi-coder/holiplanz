import type { DestinationInfo } from "../types";
import type { WeatherInfo } from "../api/weatherApi";
import { getTimeDifference } from "../utils/time";

interface Props {
  destination: string;
  loading: boolean;
  error: string | null;
  info: DestinationInfo | null;
  weather: WeatherInfo | null;
  onClose: () => void;
}

function formatDiff(diffHours: number): string {
  if (diffHours === 0) return "same time as you";
  const direction = diffHours > 0 ? "ahead of" : "behind";
  const magnitude = Math.abs(diffHours);
  const unit = magnitude === 1 ? "hour" : "hours";
  return `${magnitude} ${unit} ${direction} you`;
}

export function DestinationInfoModal({ destination, loading, error, info, weather, onClose }: Props) {
  const timeDiff = info ? getTimeDifference(info.timezone) : null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close">
          &times;
        </button>
        <h3>{destination}</h3>

        {loading && <p className="modal-loading">Loading destination info...</p>}
        {error && <p className="modal-error">{error}</p>}

        {!loading && !error && info && (
          <div className="destination-info-grid">
            {timeDiff && (
              <div className="info-tile">
                <span className="info-tile-label">Local time</span>
                <strong>{timeDiff.destinationTime}</strong>
                <span className="info-tile-sub">{formatDiff(timeDiff.diffHours)}</span>
              </div>
            )}
            {weather && (
              <div className="info-tile">
                <span className="info-tile-label">Weather now</span>
                <strong>
                  {weather.emoji} {Math.round(weather.temperatureC)}°C
                </strong>
                <span className="info-tile-sub">{weather.description}</span>
              </div>
            )}
            <div className="info-tile">
              <span className="info-tile-label">Currency</span>
              <strong>{info.currency}</strong>
            </div>
            <div className="info-tile">
              <span className="info-tile-label">Language</span>
              <strong>{info.language}</strong>
            </div>
            <div className="info-tile">
              <span className="info-tile-label">Power plug</span>
              <strong>{info.plugType}</strong>
            </div>
          </div>
        )}

        {!loading && !error && info && info.tips.length > 0 && (
          <>
            <h4>Good to know</h4>
            <ul className="destination-tips">
              {info.tips.map((tip) => (
                <li key={tip}>{tip}</li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
