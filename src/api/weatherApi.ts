export interface DailyForecast {
  /** ISO date, e.g. "2026-07-23" */
  date: string;
  maxTempC: number;
}

export interface WeatherInfo {
  temperatureC: number;
  description: string;
  emoji: string;
  /** Next 7 days — powers the "This week" row on the Trip info card. */
  daily: DailyForecast[];
}

const WEATHER_CODE_MAP: Record<number, { description: string; emoji: string }> = {
  0: { description: "Clear sky", emoji: "☀️" },
  1: { description: "Mostly clear", emoji: "\u{1F324}️" },
  2: { description: "Partly cloudy", emoji: "⛅" },
  3: { description: "Overcast", emoji: "☁️" },
  45: { description: "Fog", emoji: "\u{1F32B}️" },
  48: { description: "Freezing fog", emoji: "\u{1F32B}️" },
  51: { description: "Light drizzle", emoji: "\u{1F326}️" },
  53: { description: "Drizzle", emoji: "\u{1F326}️" },
  55: { description: "Dense drizzle", emoji: "\u{1F326}️" },
  61: { description: "Light rain", emoji: "\u{1F327}️" },
  63: { description: "Rain", emoji: "\u{1F327}️" },
  65: { description: "Heavy rain", emoji: "\u{1F327}️" },
  71: { description: "Light snow", emoji: "\u{1F328}️" },
  73: { description: "Snow", emoji: "\u{1F328}️" },
  75: { description: "Heavy snow", emoji: "\u{1F328}️" },
  80: { description: "Rain showers", emoji: "\u{1F327}️" },
  81: { description: "Rain showers", emoji: "\u{1F327}️" },
  82: { description: "Violent rain showers", emoji: "\u{1F327}️" },
  95: { description: "Thunderstorm", emoji: "⛈️" },
  96: { description: "Thunderstorm with hail", emoji: "⛈️" },
  99: { description: "Thunderstorm with hail", emoji: "⛈️" },
};

export async function fetchWeather(lat: number, lng: number): Promise<WeatherInfo | null> {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lng),
    current_weather: "true",
    daily: "temperature_2m_max",
    forecast_days: "7",
    timezone: "auto",
  });

  const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`);
  if (!res.ok) return null;

  const data = await res.json();
  const current = data?.current_weather;
  if (!current) return null;

  const dates: string[] = data?.daily?.time ?? [];
  const maxima: number[] = data?.daily?.temperature_2m_max ?? [];
  const daily: DailyForecast[] = dates.map((date, i) => ({ date, maxTempC: maxima[i] }))
    .filter((d) => typeof d.maxTempC === "number");

  const mapped = WEATHER_CODE_MAP[current.weathercode] ?? { description: "Unknown", emoji: "\u{1F321}️" };
  return {
    temperatureC: current.temperature,
    description: mapped.description,
    emoji: mapped.emoji,
    daily,
  };
}
