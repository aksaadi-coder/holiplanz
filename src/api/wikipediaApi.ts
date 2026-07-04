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

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9\s]/g, "");
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
