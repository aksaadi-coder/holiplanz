import L from "leaflet";

export const MARKER_COLOR = "#dc2626";
export const DONE_COLOR = "#16a34a";
export const ACCOMMODATION_COLOR = "#2563eb";

export function numberedIcon(
  number: number,
  highlighted: boolean,
  flagged: boolean,
  done = false,
): L.DivIcon {
  const size = highlighted ? 34 : 28;
  const border = flagged ? "dashed 2px #666" : "solid 2px white";
  const background = done ? DONE_COLOR : flagged ? "#999" : MARKER_COLOR;
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
