/**
 * The city part of a destination string — "Lisbon, Portugal" → "Lisbon".
 * Headers show the city only so they stay on one line.
 */
export function cityName(destination: string): string {
  return destination.split(",")[0].trim();
}

/** "1 day" / "7 days" — avoids the "1 days" glitch in trip headers. */
export function dayLabel(numDays: number): string {
  return `${numDays} ${numDays === 1 ? "day" : "days"}`;
}

/**
 * Countdown badge for a trip that hasn't started yet — "TODAY" / "TOMORROW" /
 * "STARTS IN 3 DAYS" / "STARTS IN 3 WEEKS". Returns null once the trip has
 * started (or with no start date), since the badge only makes sense for
 * trips still coming up.
 */
export function startsInLabel(startDate: string | undefined): string | null {
  if (!startDate) return null;
  const diffDays = daysUntilTrip(startDate);
  if (diffDays === null || diffDays < 0) return null;
  if (diffDays === 0) return "TODAY";
  if (diffDays === 1) return "TOMORROW";
  if (diffDays < 7) return `STARTS IN ${diffDays} DAYS`;
  const weeks = Math.round(diffDays / 7);
  return `STARTS IN ${weeks} WEEK${weeks === 1 ? "" : "S"}`;
}

/** Whole days between today and a trip's start date (negative once it's
 *  started, null with no start date). Shared by startsInLabel and the
 *  "before you go" prep reminder banner. */
export function daysUntilTrip(startDate: string | undefined): number | null {
  if (!startDate) return null;
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((start.getTime() - today.getTime()) / 86_400_000);
}

/** Which trip day today is, 1-indexed (day 1 = start date). Null with no
 *  start date, negative/zero-or-above numbers are meaningless outside
 *  [1, numDays] — callers should gate with isDuringTrip. */
export function tripDayIndex(startDate: string | undefined): number | null {
  const daysOut = daysUntilTrip(startDate);
  return daysOut === null ? null : -daysOut + 1;
}

/** True from the trip's start date through its last day (inclusive) —
 *  the window where the "before you go" checklist no longer applies and
 *  the itinerary should highlight what's happening next instead. */
export function isDuringTrip(startDate: string | undefined, numDays: number): boolean {
  const idx = tripDayIndex(startDate);
  return idx !== null && idx >= 1 && idx <= numDays;
}
