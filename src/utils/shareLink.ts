import type { DestinationInfo, Itinerary } from "../types";
import { scheduleForDay } from "./schedule";

/**
 * A trip as it travels to someone else. Deliberately not an Itinerary: this
 * is a snapshot for reading, so it carries what the shared page draws and
 * nothing else — no chat history, no budget, no visited stops, no ids the
 * recipient could act on.
 *
 * Keys are short because the whole thing has to fit in a URL. The version
 * goes first and never changes meaning: a link someone was sent last year
 * still has to open.
 */
export interface SharedTrip {
  /** Payload version. Bump only for a change old readers can't survive. */
  v: 1;
  /** Trip title, e.g. "Japan Family Escape". */
  ti: string;
  /** Full destination string, for the photo, the stamp and the fact lookup. */
  de: string;
  /** ISO start date, or "" when the trip has none. */
  sd: string;
  /** Number of days. */
  nd: number;
  /** Who sent it — a display name, never an email. */
  by: string;
  /** Cities in visit order, for the "Tokyo → Kyoto → Osaka" line. */
  ro: string[];
  /** Passport-style number, so the page matches the sender's own trip. */
  no: string;
  /** Where they're staying, if a stay is confirmed. */
  st?: string;
  /** Trip style, e.g. "Family getaway". */
  ts?: string;
  /** Destination facts, carried rather than fetched — see buildSharedTrip. */
  cu?: string;
  la?: string;
  pl?: string;
  days: SharedDay[];
}

export interface SharedDay {
  /** Day number, 1-based. */
  n: number;
  /** Day title, e.g. "Fuji & Hakone". */
  t: string;
  s: SharedStop[];
  /** Where they sleep *that* night, if it's settled. Per day rather than per
   *  trip: a trip that moves Tokyo → Kyoto has a different fixed point each
   *  leg, and drawing the first one on every map would put a dot 400km off
   *  the day's stops and squash the day itself into a smudge. */
  h?: [number, number];
}

export interface SharedStop {
  /** Clock time as shown on the itinerary, e.g. "08:00". */
  t: string;
  n: string;
  /** One-line description. */
  d: string;
  /** Coordinates, rounded — the mini map is 300px wide, so four decimals
   *  (about 10m) is already more precision than it can draw. */
  a: number;
  o: number;
  /** Category, for the map dot. */
  c: string;
}

/** Marks how the payload was packed, so the reader doesn't have to guess and
 *  a browser without CompressionStream can still produce a working link. */
const DEFLATED = "1";
const PLAIN = "0";

/** Path a shared link lives at. */
export const SHARE_PATH = "/s";

const round = (n: number) => Math.round(n * 1e4) / 1e4;

/**
 * Builds the snapshot. Times come from the same scheduler the itinerary
 * screen uses, so the shared page shows the hours the sender saw rather than
 * recomputing them from a different starting point.
 */
export function buildSharedTrip(
  itinerary: Itinerary,
  sharedBy: string,
  passportNumber: string,
  tripStyle: string | undefined,
  facts: DestinationInfo | null,
): SharedTrip {
  const stay = confirmedStay(itinerary);
  return {
    v: 1,
    ti: itinerary.tripTitle || itinerary.destination,
    de: itinerary.destination,
    sd: itinerary.startDate ?? "",
    nd: itinerary.numDays,
    by: sharedBy,
    ro: routeCities(itinerary),
    no: passportNumber,
    ...(stay ? { st: stay.name } : {}),
    ...(tripStyle ? { ts: tripStyle } : {}),
    ...(facts?.currency ? { cu: facts.currency } : {}),
    ...(facts?.language ? { la: facts.language } : {}),
    ...(facts?.plugType ? { pl: facts.plugType } : {}),
    days: itinerary.days.map((day) => {
      const times = scheduleForDay(day);
      const bed = stayForDay(itinerary, day.dayNumber);
      return {
        n: day.dayNumber,
        t: day.title,
        ...(bed ? { h: [round(bed.lat), round(bed.lng)] as [number, number] } : {}),
        s: day.stops.map((stop) => ({
          t: times.get(stop.id) ?? "",
          n: stop.name,
          d: stop.description,
          a: round(stop.lat),
          o: round(stop.lng),
          c: stop.category,
        })),
      };
    }),
  };
}

/** The stay the user actually settled on. Confirming collapses a stay's
 *  options down to the chosen one (see handleConfirmAccommodation), so a
 *  single option is what "decided" looks like — a list of three is still a
 *  question, and nothing to tell a guest about. */
function confirmedStay(itinerary: Itinerary) {
  return itinerary.accommodations?.find((a) => a.options.length === 1)?.options[0];
}

/** The settled stay covering a given day, if there is one. */
function stayForDay(itinerary: Itinerary, dayNumber: number) {
  return itinerary.accommodations?.find(
    (a) => a.options.length === 1 && dayNumber >= a.startDay && dayNumber <= a.endDay,
  )?.options[0];
}

/** Day titles, deduped, as the "Tokyo → Kyoto → Osaka" line. */
function routeCities(itinerary: Itinerary): string[] {
  const seen: string[] = [];
  for (const day of itinerary.days) {
    const city = day.title.split(/[·—–-]/)[0].trim();
    if (city && !seen.includes(city)) seen.push(city);
  }
  return seen.slice(0, 4);
}

/**
 * Packs a snapshot into the string that rides in the link's fragment.
 *
 * The fragment is the point: it never leaves the recipient's browser, so a
 * shared trip is never sent to any server, ours included. It also means the
 * link is the whole trip — there's nothing to store, expire, or take down.
 */
export async function encodeShare(trip: SharedTrip): Promise<string> {
  const json = new TextEncoder().encode(JSON.stringify(trip));
  if (typeof CompressionStream === "undefined") return PLAIN + toBase64Url(json);
  const packed = await collect(
    new Blob([json]).stream().pipeThrough(new CompressionStream("deflate-raw")),
  );
  return DEFLATED + toBase64Url(packed);
}

/** Reads a payload back. Returns null for anything malformed — the link is
 *  user-pasteable, so a truncated one has to land on "we can't open this"
 *  rather than a crash. */
export async function decodeShare(raw: string): Promise<SharedTrip | null> {
  try {
    const marker = raw[0];
    const body = fromBase64Url(raw.slice(1));
    const bytes =
      marker === DEFLATED
        ? await collect(new Blob([body]).stream().pipeThrough(new DecompressionStream("deflate-raw")))
        : body;
    const parsed = JSON.parse(new TextDecoder().decode(bytes)) as SharedTrip;
    if (parsed?.v !== 1 || !Array.isArray(parsed.days)) return null;
    return parsed;
  } catch {
    return null;
  }
}

/** The full link to send. Absolute, because it's about to leave the app. */
export function shareUrl(payload: string, origin = window.location.origin): string {
  return `${origin}${SHARE_PATH}#${payload}`;
}

/** Whether this page load is someone opening a shared trip. Matched exactly
 *  rather than by prefix, so a future /settings or /saved isn't swallowed. */
export function isSharePath(pathname = window.location.pathname): boolean {
  return pathname === SHARE_PATH || pathname.startsWith(`${SHARE_PATH}/`);
}

/** The payload in the current URL. Empty when the link arrived without one,
 *  which the shared page reports as a link that didn't survive the trip. */
export function sharePayloadFromLocation(): string {
  return window.location.hash.slice(1);
}

async function collect(stream: ReadableStream<Uint8Array>): Promise<Uint8Array<ArrayBuffer>> {
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  // Chunked: a spread of a few thousand bytes into String.fromCharCode is
  // fine, but a long trip is tens of thousands and would blow the arg limit.
  for (let i = 0; i < bytes.length; i += 8192) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// Annotated with the concrete buffer type: TypeScript 5.7 made Uint8Array
// generic over it, and a Blob part won't take the SharedArrayBuffer-or-not
// default that a bare Uint8Array widens to.
function fromBase64Url(text: string): Uint8Array<ArrayBuffer> {
  const padded = text.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(padded + "=".repeat((4 - (padded.length % 4)) % 4));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}
