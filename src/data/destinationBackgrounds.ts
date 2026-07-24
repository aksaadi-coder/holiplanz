// Destination → background photo database.
//
// HOW TO ADD A PHOTO:
//   1. Drop an image into `public/assets/backgrounds/` (e.g. `paris.jpg`).
//   2. Add an entry below: `{ image: "paris.jpg", match: ["paris", "france"] }`.
//      `match` is a list of lowercase keywords — if the destination the user
//      typed contains ANY of them, this photo is used.
//   3. Order matters only for overlaps: the FIRST entry that matches wins,
//      so put more specific places (cities) above broader ones (countries).
//
// The blurred photo appears behind the Home form, generation screen, and the
// itinerary header, tinted to keep text readable. If nothing matches, the
// default (Mount Fuji / Japan) is shown.

export interface DestinationBackground {
  /** Filename inside public/assets/backgrounds/ */
  image: string;
  /** Lowercase keywords; a hit on any one selects this photo. */
  match: string[];
  /** Optional human label, for future UI / alt text. */
  label?: string;
}

/** Shown when the typed destination matches nothing below. */
export const DEFAULT_BACKGROUND = "Japan.png";

// NOTE: `image` must match the filename in public/assets/backgrounds/ EXACTLY,
// including capitalization — Vercel serves on a case-sensitive Linux filesystem.
export const DESTINATION_BACKGROUNDS: DestinationBackground[] = [
  { image: "Japan.png", match: ["japan", "tokyo", "kyoto", "osaka", "fuji"], label: "Japan · Mount Fuji" },
  { image: "London.png", match: ["london", "england", "uk", "united kingdom", "britain"], label: "London · Big Ben" },
  { image: "Paris.png", match: ["paris", "france"], label: "Paris · Eiffel Tower" },
  // Add more here as you collect photos, e.g.:
  // { image: "lisbon.jpg",   match: ["lisbon", "portugal"] },
  // { image: "marrakech.jpg",match: ["marrakech", "morocco"] },
];

const BACKGROUND_BASE = "/assets/backgrounds/";

/**
 * Resolve a typed destination (e.g. "Kyoto, Japan") to a background image URL.
 * Case-insensitive substring match against each entry's keywords; falls back
 * to the Mount Fuji / Japan default.
 */
export function resolveBackground(destination: string | undefined | null): string {
  const needle = (destination ?? "").trim().toLowerCase();
  if (needle) {
    for (const entry of DESTINATION_BACKGROUNDS) {
      if (entry.match.some((keyword) => needle.includes(keyword))) {
        return BACKGROUND_BASE + entry.image;
      }
    }
  }
  return BACKGROUND_BASE + DEFAULT_BACKGROUND;
}
