import { useCallback, useState } from "react";

const STORAGE_KEY = "holidayPlanner.travelerProfile.v1";

export const AGE_RANGE_OPTIONS = ["18–24", "25–34", "35–44", "45–54", "55–64", "65+"];
export const TRAVEL_STATUS_OPTIONS = ["Solo", "Couple", "Married", "Family"];
export const KID_AGE_OPTIONS = ["Toddler", "Young child", "Teen"];
export const INTEREST_OPTIONS = [
  "Adventurous",
  "Foodie",
  "Culture",
  "Nature",
  "Nightlife",
  "Relaxation",
  "Shopping",
];
export const PROFILE_PACE_OPTIONS = ["Easy", "Balanced", "Packed"];
export const PROFILE_SPEND_OPTIONS = ["Budget", "Mid-range", "Luxury"];

export interface TravelerProfile {
  ageRange: string | null;
  travelStatus: string | null;
  hasKids: boolean;
  kidAges: string[];
  interests: string[];
  pace: string | null;
  spend: string | null;
  notes: string;
}

const DEFAULTS: TravelerProfile = {
  ageRange: null,
  travelStatus: null,
  hasKids: false,
  kidAges: [],
  interests: [],
  pace: null,
  spend: null,
  notes: "",
};

function read(): TravelerProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return DEFAULTS;
  }
}

/**
 * Traveler profile — age range, travel status, kids, interests, and default
 * pace/spend. Client-only and self-reported, same storage pattern as
 * useAccountPrefs. Feeds itinerary generation via composeProfileNote below;
 * it never changes what the per-trip pickers (HomeScreen, PreferencesScreen)
 * show as selected — those stay untouched until the user picks something.
 */
export function useTravelerProfile() {
  const [profile, setProfile] = useState<TravelerProfile>(read);

  const update = useCallback((patch: Partial<TravelerProfile>) => {
    setProfile((prev) => {
      const next = { ...prev, ...patch };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* ignore quota / private-mode errors */
      }
      return next;
    });
  }, []);

  return { profile, update };
}

/**
 * Turns the structured profile into one free-text sentence, prepended to the
 * `preferences` string sent with every new itinerary generation — the same
 * field systemPrompt.ts already reads ("Respect stated preferences..."), so
 * this needs no server or schema changes. Returns "" when the profile is
 * empty (a skipped first-run, or nothing filled in since) so it adds nothing.
 */
export function composeProfileNote(profile: TravelerProfile): string {
  const parts: string[] = [];

  if (profile.travelStatus === "Family" || profile.hasKids) {
    parts.push(
      profile.kidAges.length > 0
        ? `Traveling as a family with kids (${profile.kidAges.join(", ").toLowerCase()}).`
        : "Traveling as a family with kids.",
    );
  } else if (profile.travelStatus) {
    parts.push(`Traveling ${profile.travelStatus.toLowerCase()}.`);
  }

  if (profile.ageRange) parts.push(`Traveler age range: ${profile.ageRange}.`);
  if (profile.interests.length > 0) parts.push(`Interests: ${profile.interests.join(", ").toLowerCase()}.`);
  if (profile.pace) parts.push(`Prefers a ${profile.pace.toLowerCase()} pace.`);
  if (profile.spend) parts.push(`Prefers ${profile.spend.toLowerCase()} spending.`);
  if (profile.notes.trim()) parts.push(profile.notes.trim());

  return parts.join(" ");
}
