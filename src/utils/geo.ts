const EARTH_RADIUS_KM = 6371;
const FLAG_THRESHOLD_KM = 100;

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

export function isFlaggedLocation(
  stop: { lat: number; lng: number },
  center: { lat: number; lng: number },
): boolean {
  return distanceKm(stop, center) > FLAG_THRESHOLD_KM;
}

export function googleMapsUrl(stop: { lat: number; lng: number }): string {
  return `https://www.google.com/maps/search/?api=1&query=${stop.lat},${stop.lng}`;
}

export function directionsUrl(
  destination: { lat: number; lng: number },
  origin?: { lat: number; lng: number },
): string {
  const params = new URLSearchParams({
    api: "1",
    destination: `${destination.lat},${destination.lng}`,
  });
  if (origin) params.set("origin", `${origin.lat},${origin.lng}`);
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

export function googleSearchUrl(stopName: string, destination: string): string {
  return `https://www.google.com/search?q=${encodeURIComponent(`${stopName} ${destination}`)}`;
}

export function tripAdvisorSearchUrl(stopName: string, destination: string): string {
  return `https://www.tripadvisor.com/Search?q=${encodeURIComponent(`${stopName} ${destination}`)}`;
}

export function bookingSearchUrl(name: string, destination: string): string {
  return `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(`${name}, ${destination}`)}`;
}

export function airbnbSearchUrl(name: string, destination: string): string {
  return `https://www.airbnb.com/s/homes?query=${encodeURIComponent(`${name}, ${destination}`)}`;
}
