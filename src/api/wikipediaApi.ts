export interface PlaceInfo {
  title: string;
  extract: string;
  thumbnailUrl: string | null;
  pageUrl: string;
}

interface WikiPage {
  title: string;
  extract?: string;
  fullurl?: string;
  thumbnail?: { source: string };
}

const cache = new Map<string, PlaceInfo | null>();

// Matches combining diacritical marks left behind by NFD decomposition
// (Unicode general category Mn — "Mark, nonspacing").
const DIACRITIC_MARKS = /\p{Mn}/gu;

// Strips diacritics (e -> e, o -> o, ...) via Unicode decomposition before
// dropping non-ASCII characters, so romanized titles with macrons/accents
// (e.g. Wikipedia's "Senso-ji") still match plain-ASCII stop names.
function normalize(s: string): string {
  return s
    .normalize("NFD")
    .replace(DIACRITIC_MARKS, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "");
}

function isRelevantMatch(stopName: string, pageTitle: string): boolean {
  const titleNorm = normalize(pageTitle);
  const stopWords = normalize(stopName)
    .split(/\s+/)
    .filter((w) => w.length > 2);
  return stopWords.some((w) => titleNorm.includes(w));
}

export async function fetchPlaceInfo(stopName: string, destination: string): Promise<PlaceInfo | null> {
  const cacheKey = `${stopName}|${destination}`;
  if (cache.has(cacheKey)) return cache.get(cacheKey)!;

  const params = new URLSearchParams({
    action: "query",
    generator: "search",
    gsrsearch: `${stopName} ${destination}`,
    gsrlimit: "1",
    prop: "extracts|pageimages|info",
    exintro: "1",
    explaintext: "1",
    exsentences: "3",
    piprop: "thumbnail",
    pithumbsize: "500",
    inprop: "url",
    format: "json",
    origin: "*",
  });

  const res = await fetch(`https://en.wikipedia.org/w/api.php?${params.toString()}`);
  if (!res.ok) {
    cache.set(cacheKey, null);
    return null;
  }

  const data = await res.json();
  const pages = data?.query?.pages as Record<string, WikiPage> | undefined;
  const page = pages ? Object.values(pages)[0] : undefined;

  if (!page || !page.extract || !page.fullurl || !isRelevantMatch(stopName, page.title)) {
    cache.set(cacheKey, null);
    return null;
  }

  const info: PlaceInfo = {
    title: page.title,
    extract: page.extract,
    thumbnailUrl: page.thumbnail?.source ?? null,
    pageUrl: page.fullurl,
  };
  cache.set(cacheKey, info);
  return info;
}

const factsCache = new Map<string, string[]>();

/** Split a Wikipedia extract into standalone sentences, dropping fragments
 *  too short/long to read well as a single rotating "fact" line. */
function splitSentences(text: string): string[] {
  return text
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+(?=[A-Z(])/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 25 && s.length <= 170);
}

/**
 * Short "Did you know" facts about a destination, sourced from its Wikipedia
 * intro — works for any real-world place typed in, not just a hardcoded
 * shortlist. Returns [] if nothing relevant is found (caller should fall
 * back to a generic, destination-named line rather than an unrelated fact).
 */
export async function fetchDestinationFacts(destination: string): Promise<string[]> {
  const cacheKey = destination.trim().toLowerCase();
  if (!cacheKey) return [];
  if (factsCache.has(cacheKey)) return factsCache.get(cacheKey)!;

  const params = new URLSearchParams({
    action: "query",
    generator: "search",
    gsrsearch: destination,
    gsrlimit: "1",
    prop: "extracts",
    exintro: "1",
    explaintext: "1",
    exsentences: "8",
    format: "json",
    origin: "*",
  });

  try {
    const res = await fetch(`https://en.wikipedia.org/w/api.php?${params.toString()}`);
    if (!res.ok) throw new Error("bad response");
    const data = await res.json();
    const pages = data?.query?.pages as Record<string, WikiPage> | undefined;
    const page = pages ? Object.values(pages)[0] : undefined;

    if (!page?.extract || !isRelevantMatch(destination, page.title)) {
      factsCache.set(cacheKey, []);
      return [];
    }

    const facts = splitSentences(page.extract)
      .slice(0, 5)
      .map((s) => `Did you know — ${s.replace(/\.$/, "")}.`);
    factsCache.set(cacheKey, facts);
    return facts;
  } catch {
    factsCache.set(cacheKey, []);
    return [];
  }
}
