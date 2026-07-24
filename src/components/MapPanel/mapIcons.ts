import L from "leaflet";
import { INK, CORAL } from "../../styles/palette";

// Brand palette for map pins/route — ink is the default stop color, coral is
// reserved for "earned" moments (a visited stop is an earned checkmark, same
// as the passport stamp), matching the rest of the design system.
export const MARKER_COLOR = INK;
export const DONE_COLOR = CORAL;
export const ACCOMMODATION_COLOR = INK;

export function numberedIcon(
  number: number,
  highlighted: boolean,
  flagged: boolean,
  done = false,
): L.DivIcon {
  const size = highlighted ? 34 : 28;
  const border = flagged ? "dashed 2px rgba(22,20,16,0.4)" : "solid 2px white";
  const background = done ? DONE_COLOR : flagged ? "rgba(22,20,16,0.4)" : MARKER_COLOR;
  const label = done ? "&#10003;" : String(number);
  return L.divIcon({
    className: "stop-marker",
    html: `<div class="stop-marker-inner" style="width:${size}px;height:${size}px;background:${background};border:${border};">${label}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
}

export function accommodationIcon(label: string, highlighted = false): L.DivIcon {
  const size = highlighted ? 34 : 28;
  return L.divIcon({
    className: "accommodation-marker",
    html: `<div class="accommodation-marker-inner" style="width:${size}px;height:${size}px;background:${ACCOMMODATION_COLOR};"><span class="accommodation-marker-label">${label}</span></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
}
