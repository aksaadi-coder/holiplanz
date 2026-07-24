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
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.round((start.getTime() - today.getTime()) / 86_400_000);
  if (diffDays < 0) return null;
  if (diffDays === 0) return "TODAY";
  if (diffDays === 1) return "TOMORROW";
  if (diffDays < 7) return `STARTS IN ${diffDays} DAYS`;
  const weeks = Math.round(diffDays / 7);
  return `STARTS IN ${weeks} WEEK${weeks === 1 ? "" : "S"}`;
}
