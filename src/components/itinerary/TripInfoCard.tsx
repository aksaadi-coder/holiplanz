import { useEffect, useState } from "react";
import type { DestinationInfo } from "../../types";
import { fetchDestinationInfo } from "../../api/itineraryApi";
import { fetchWeather, type WeatherInfo } from "../../api/weatherApi";
import { getTimeDifference } from "../../utils/time";
import { cityName } from "../../utils/destination";
import { FloatingCard, CloseCircle } from "../ui/primitives";

interface Props {
  open: boolean;
  destination: string;
  center: { lat: number; lng: number };
  onClose: () => void;
}

/** "Trip info" floating card — local time, weather, currency, language, plug. */
export function TripInfoCard({ open, destination, center, onClose }: Props) {
  const [info, setInfo] = useState<DestinationInfo | null>(null);
  const [weather, setWeather] = useState<WeatherInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || info || loading) return;
    setLoading(true);
    setError(null);
    Promise.all([fetchDestinationInfo(destination), fetchWeather(center.lat, center.lng)])
      .then(([d, w]) => {
        setInfo(d);
        setWeather(w);
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Couldn't load destination info right now."),
      )
      .finally(() => setLoading(false));
  }, [open, destination, center.lat, center.lng, info, loading]);

  const diff = info?.timezone ? getTimeDifference(info.timezone) : null;
  const shortName = cityName(destination);

  return (
    <FloatingCard open={open} onClose={onClose}>
      <div className="hp-ti-head">
        <b>{shortName}</b>
        <CloseCircle onClose={onClose} />
      </div>

      {loading && <p className="hp-muted">Loading destination info…</p>}
      {error && <p className="hp-cd-error">{error}</p>}

      {info && (
        <>
          <div className="hp-ti-grid">
            <div className="hp-ti-tile">
              <p className="hp-label">Local time</p>
              <b>{diff?.destinationTime ?? "—"}</b>
              {diff && (
                <div>
                  {diff.diffHours === 0
                    ? "Same as you"
                    : `${Math.abs(diff.diffHours)} hours ${diff.diffHours > 0 ? "ahead of" : "behind"} you`}
                </div>
              )}
            </div>
            <div className="hp-ti-tile">
              <p className="hp-label">Weather now</p>
              <b>{weather ? `${Math.round(weather.temperatureC)}°C` : "—"}</b>
              {weather && <div>{weather.description}</div>}
            </div>
            <div className="hp-ti-tile">
              <p className="hp-label">Currency</p>
              <b>{info.currency}</b>
            </div>
            <div className="hp-ti-tile">
              <p className="hp-label">Language</p>
              <b>{info.language}</b>
            </div>
          </div>

          <div className="hp-ti-tile hp-ti-wide">
            <p className="hp-label">Power plug</p>
            <b>{info.plugType}</b>
          </div>

          {weather?.daily && weather.daily.length > 0 && (
            <div className="hp-ti-tile hp-ti-wide">
              <p className="hp-label">This week</p>
              <div className="hp-ti-week">
                {weather.daily.slice(0, 7).map((d) => (
                  <span key={d.date}>
                    <b>{Math.round(d.maxTempC)}°</b>
                    {new Date(d.date).toLocaleDateString(undefined, { weekday: "short" })}
                  </span>
                ))}
              </div>
            </div>
          )}

          {info.tips.length > 0 && (
            <div className="hp-ti-tile hp-ti-wide">
              <p className="hp-label">Good to know</p>
              <ul className="hp-cd-list">
                {info.tips.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </FloatingCard>
  );
}
