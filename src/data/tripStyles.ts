/** Trip styles offered in Adjust preferences, and read back out of an
 *  itinerary's free-text preferences elsewhere (the shared trip's fact grid
 *  names one). Kept here so both ends agree on the same wording. */
export const STYLE_OPTIONS = [
  "Family getaway",
  "Adventurous",
  "Romantic",
  "Relaxed",
  "Cultural",
  "Foodie",
];

/** The style a trip was planned with, if its preferences name one. */
export function tripStyleFrom(preferences: string | undefined): string | undefined {
  const seed = (preferences ?? "").toLowerCase();
  return STYLE_OPTIONS.find((o) => seed.includes(o.toLowerCase()));
}
