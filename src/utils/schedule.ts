import type { Day, TimeOfDay } from "../types";

// The itinerary model stores a coarse `timeOfDay` bucket, but the design shows
// real clock times ("09:00", "11:30"). We derive a plausible schedule: each stop
// starts at its bucket's opening time, or after the previous stop finishes —
// whichever is later — so times always run forward within a day.

const BUCKET_START: Record<TimeOfDay, number> = {
  morning: 9 * 60,
  midday: 12 * 60,
  afternoon: 14 * 60,
  evening: 18 * 60,
  night: 20 * 60,
};

const DEFAULT_DURATION_MIN = 90;
/** Padding between stops to stand in for getting from one to the next. */
const TRAVEL_BUFFER_MIN = 30;

function format(totalMinutes: number): string {
  const clamped = Math.min(totalMinutes, 23 * 60 + 45);
  const h = Math.floor(clamped / 60);
  const m = clamped % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** Round to the nearest 15 minutes so times read as planned, not computed. */
function roundQuarter(minutes: number): number {
  return Math.round(minutes / 15) * 15;
}

/** Map of stopId → "HH:MM" for one day. */
export function scheduleForDay(day: Day): Map<string, string> {
  const times = new Map<string, string>();
  let cursor: number | null = null;

  for (const stop of day.stops) {
    const bucketStart = BUCKET_START[stop.timeOfDay] ?? BUCKET_START.afternoon;
    const start = cursor === null ? bucketStart : Math.max(cursor, bucketStart);
    const rounded = roundQuarter(start);
    times.set(stop.id, format(rounded));
    cursor = rounded + (stop.durationMinutes ?? DEFAULT_DURATION_MIN) + TRAVEL_BUFFER_MIN;
  }

  return times;
}
