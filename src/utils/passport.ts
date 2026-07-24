import type { Itinerary, StopCategory } from "../types";
import { distanceKm } from "./geo";
import { cityName } from "./destination";

/** Friendly stamp label per stop category. */
const CATEGORY_LABEL: Record<StopCategory, string> = {
  landmark: "Attraction",
  museum: "Museum",
  food: "Food",
  nature: "Park",
  shopping: "Shopping",
  nightlife: "Nightlife",
  activity: "Activity",
  transport: "Transit",
  accommodation: "Stay",
  other: "Other",
};

export interface CategoryStamp {
  category: StopCategory;
  label: string;
  /** Number of visited stops in this category. */
  count: number;
}

/** Where a category stamp sits and how far it's tilted — a real stamp
 *  collage, not a tidy grid. */
export interface StampPlacement {
  top: string;
  left?: string;
  right?: string;
  rotate: number;
}

export interface PassportData {
  /** Stable 6-digit "passport number" derived from the trip id. */
  number: string;
  /** Country/destination shown big on the central stamp, e.g. "JAPAN". */
  stampLabel: string;
  stampDate: string;
  tripTitle: string;
  tripType: string;
  duration: string;
  dates: string | null;
  /** Same as `dates` but with the year appended — used on the compact mini
   *  passport, where there's no separate "Dates" field to carry it. */
  datesWithYear: string | null;
  /** e.g. ["TOKYO"] or ["TOKYO","KYOTO","OSAKA"] — upper-case, for the MRZ. */
  route: string[];
  /** Same cities as `route`, title-case — used in prose (e.g. the mini
   *  passport's meta line), where all-caps would read as shouting. */
  routeTitleCase: string[];
  totalKm: number;
  visitedCount: number;
  totalStops: number;
  /** Up to four VISITED category stamps (most-common first) — categories
   *  with nothing visited yet are omitted entirely, not shown greyed out. */
  categories: CategoryStamp[];
  /** Scattered position + tilt for each entry in `categories`, same order. */
  stampPlacements: StampPlacement[];
  /** Degrees the central destination stamp is tilted — varies per trip, from
   *  dead straight to a noticeable incline, like a real ink stamp. */
  destStampRotate: number;
  /** Passport machine-readable-zone lines. */
  mrz: [string, string];
}

function hashId(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return hash;
}

/** Deterministic PRNG (mulberry32) — same trip id always lays out the same
 *  "random" collage, so it doesn't jitter between renders or exports. */
function seededRandom(seed: number): () => number {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const STAMP_QUADRANTS: Array<Omit<StampPlacement, "rotate">> = [
  { top: "14px", left: "0px" },
  { top: "14px", right: "0px" },
  { top: "290px", left: "0px" },
  { top: "290px", right: "0px" },
];

/** Scatter up to 4 stamps across the four quadrants (shuffled per trip so the
 *  same category doesn't always land in the same corner), each nudged off
 *  its anchor and tilted a few degrees. */
function stampPlacementsFor(seed: number, count: number): StampPlacement[] {
  const rng = seededRandom(seed);
  const order = [0, 1, 2, 3];
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order.slice(0, count).map((quadrantIndex) => {
    const base = STAMP_QUADRANTS[quadrantIndex];
    const jitterV = Math.round((rng() - 0.5) * 40);
    const jitterH = Math.round((rng() - 0.5) * 40);
    const rotate = Math.round((rng() - 0.5) * 26);
    const placement: StampPlacement = {
      top: `calc(${base.top} + ${jitterV}px)`,
      rotate,
    };
    if (base.left !== undefined) placement.left = `calc(${base.left} + ${jitterH}px)`;
    if (base.right !== undefined) placement.right = `calc(${base.right} - ${jitterH}px)`;
    return placement;
  });
}

export function stableNumber(id: string): string {
  const hash = hashId(id);
  return `N° ${String(hash % 1_000_000).padStart(6, "0")}`;
}

function tripType(preferences: string | undefined): string {
  const p = (preferences ?? "").toLowerCase();
  if (/family|kid|child/.test(p)) return "Family trip";
  if (/romantic|honeymoon|couple/.test(p)) return "Romantic trip";
  if (/adventur/.test(p)) return "Adventure trip";
  if (/relax|slow|easy/.test(p)) return "Relaxed trip";
  if (/food|culinary/.test(p)) return "Foodie trip";
  if (/cultur|history|museum/.test(p)) return "Cultural trip";
  return "Trip";
}

/** The destination's country (last comma segment) or the whole string, upper-cased. */
function stampLabelFor(destination: string): string {
  const parts = destination.split(",").map((s) => s.trim());
  return (parts.length > 1 ? parts[parts.length - 1] : parts[0]).toUpperCase();
}

function formatStampDate(startDate: string | undefined): string {
  const d = startDate ? new Date(startDate) : new Date();
  return d
    .toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
    .toUpperCase();
}

export function formatDateRange(
  startDate: string | undefined,
  numDays: number,
  opts?: { withYear?: boolean },
): string | null {
  if (!startDate) return null;
  const start = new Date(startDate);
  const end = new Date(start);
  end.setDate(end.getDate() + Math.max(0, numDays - 1));
  const month = (d: Date) => d.toLocaleDateString("en-GB", { month: "short" });
  const base =
    start.getMonth() === end.getMonth()
      ? `${start.getDate()}–${end.getDate()} ${month(end)}`
      : `${start.getDate()} ${month(start)} – ${end.getDate()} ${month(end)}`;
  return opts?.withYear ? `${base} ${end.getFullYear()}` : base;
}

/**
 * Route across the trip. We can't reliably infer a multi-city path from the
 * flat stop list, so we chain the distinct areas of the trip's accommodations
 * (in day order) when there are several, otherwise show the single city.
 */
export function tripRoute(itinerary: Itinerary): string[] {
  const areas = (itinerary.accommodations ?? [])
    .slice()
    .sort((a, b) => a.startDay - b.startDay)
    .map((acc) => acc.options[0]?.area)
    .filter((a): a is string => Boolean(a));
  const distinct = [...new Set(areas.map((a) => a.split(/[,/]/)[0].trim()))];
  return distinct.length > 1 ? distinct : [cityName(itinerary.destination)];
}

function routeFor(itinerary: Itinerary): string[] {
  return tripRoute(itinerary).map((n) => n.toUpperCase());
}

export function buildPassport(itinerary: Itinerary, completedStopIds: Set<string>): PassportData {
  const allStops = itinerary.days.flatMap((d) => d.stops);
  const visited = allStops.filter((s) => completedStopIds.has(s.id));

  // Distance across visited stops in itinerary order.
  let totalKm = 0;
  for (let i = 1; i < visited.length; i++) totalKm += distanceKm(visited[i - 1], visited[i]);

  // Category counts for VISITED stops only, most common first, capped at
  // four stamps — categories with nothing visited yet don't get a stamp.
  const counts = new Map<StopCategory, number>();
  for (const s of allStops) {
    if (!completedStopIds.has(s.id)) continue;
    counts.set(s.category, (counts.get(s.category) ?? 0) + 1);
  }
  const categories: CategoryStamp[] = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([category, count]) => ({ category, label: CATEGORY_LABEL[category], count }));

  const seed = hashId(itinerary.id);
  const stampPlacements = stampPlacementsFor(seed, categories.length);
  // Reuse the same seed stream, offset past the stamp layout draws, so the
  // destination stamp's tilt is independent of how many stamps preceded it.
  const destRng = seededRandom(seed ^ 0x9e3779b9);
  const destStampRotate = Math.round((destRng() - 0.5) * 22);

  const route = routeFor(itinerary);
  const kmRounded = totalKm < 1 ? Number(totalKm.toFixed(1)) : Math.round(totalKm);
  const stampLabel = stampLabelFor(itinerary.destination);
  const tripTypeLabel = tripType(itinerary.preferences);

  const line1 = `P<HOLIPLANZ<${stampLabel}<${tripTypeLabel.toUpperCase().replace(/\s+/g, "<")}${"<".repeat(12)}`;
  const line2 = `${itinerary.numDays}DAYS<${kmRounded}KM<${route.length}CITIES<${route.join("<")}<<`;

  return {
    number: stableNumber(itinerary.id),
    stampLabel,
    stampDate: formatStampDate(itinerary.startDate),
    tripTitle: itinerary.tripTitle,
    tripType: tripTypeLabel,
    duration: `${itinerary.numDays} ${itinerary.numDays === 1 ? "day" : "days"}`,
    dates: formatDateRange(itinerary.startDate, itinerary.numDays),
    datesWithYear: formatDateRange(itinerary.startDate, itinerary.numDays, { withYear: true }),
    route,
    routeTitleCase: tripRoute(itinerary),
    totalKm: kmRounded,
    visitedCount: visited.length,
    totalStops: allStops.length,
    categories,
    stampPlacements,
    destStampRotate,
    mrz: [line1, line2],
  };
}
