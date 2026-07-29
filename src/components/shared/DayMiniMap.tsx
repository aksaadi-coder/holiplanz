import type { SharedStop } from "../../utils/shareLink";

interface Props {
  stops: SharedStop[];
  /** Where they sleep that night, drawn as the coral fixed point. */
  hotel?: [number, number];
}

// Drawing space. The SVG scales to the column width, so these are proportions
// as much as pixels: a box a little wider than 3:1, which is what the design's
// map card is at phone width.
const W = 340;
const H = 116;
// Room for labels, which sit beside their dot and stick out either side of it.
const PAD_X = 48;
const PAD_TOP = 16;
const PAD_BOTTOM = 30;

const DOT_R = 4.4;
const LABEL_H = 17;
const LABEL_FONT = 10.5;
/** Enough for the label pill without measuring text, which SVG can't do
 *  before it's on screen. Hanken Grotesk at 10.5px averages a shade under
 *  6px a character; the pill is forgiving either side. */
const CHAR_W = 5.9;
const LABEL_PAD_X = 7;

interface Placed {
  x: number;
  y: number;
  label: string;
  hotel: boolean;
  /** Label box, already resolved above or below the dot. */
  lx: number;
  ly: number;
  lw: number;
}

/**
 * The little map above each day on a shared trip — a flat, drawn map rather
 * than a real one.
 *
 * A guest reading someone else's plan wants the shape of the day: what's near
 * what, and in which order. Tiles would answer a question nobody asked, cost a
 * network round trip each, need attribution, and go grey when they fail. Three
 * dots and a dashed line answer it exactly, from coordinates the link already
 * carries.
 */
export function DayMiniMap({ stops, hotel }: Props) {
  const points = layout(stops, hotel);
  if (points.length === 0) return null;

  const path = points.filter((p) => !p.hotel);

  return (
    <svg
      className="hp-shared-map"
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={`Map of ${path.map((p) => p.label).join(", ")}`}
    >
      <rect x="0" y="0" width={W} height={H} rx="14" className="hp-shared-map-bg" />

      {path.length > 1 && (
        <polyline
          className="hp-shared-map-route"
          points={path.map((p) => `${p.x},${p.y}`).join(" ")}
          fill="none"
        />
      )}

      {points.map((p) => (
        <g key={`${p.label}-${p.x}-${p.y}`}>
          <circle
            cx={p.x}
            cy={p.y}
            r={DOT_R}
            className={p.hotel ? "hp-shared-map-dot is-stay" : "hp-shared-map-dot"}
          />
          <rect
            x={p.lx}
            y={p.ly}
            width={p.lw}
            height={LABEL_H}
            rx={LABEL_H / 2}
            className="hp-shared-map-pill"
          />
          <text
            x={p.lx + p.lw / 2}
            y={p.ly + LABEL_H / 2}
            className={p.hotel ? "hp-shared-map-text is-stay" : "hp-shared-map-text"}
            fontSize={LABEL_FONT}
            textAnchor="middle"
            dominantBaseline="central"
          >
            {p.label}
          </text>
        </g>
      ))}
    </svg>
  );
}

/**
 * Projects the day's coordinates into the box and resolves where each label
 * can sit. Longitude is scaled by cos(latitude) so the drawing keeps the
 * shape of the real ground, and both axes share one scale factor so a day
 * that runs mostly north-south doesn't get stretched sideways to fill the box.
 */
function layout(stops: SharedStop[], hotel?: [number, number]): Placed[] {
  const places = stops
    .map((s) => ({ lat: s.a, lng: s.o, label: shortLabel(s.n), hotel: false }))
    .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng));

  const raw =
    hotel && nearby(hotel, places)
      ? [...places, { lat: hotel[0], lng: hotel[1], label: "Hotel", hotel: true }]
      : places;
  if (raw.length === 0) return [];

  const meanLat = raw.reduce((sum, p) => sum + p.lat, 0) / raw.length;
  const k = Math.cos((meanLat * Math.PI) / 180) || 1;
  const xs = raw.map((p) => p.lng * k);
  const ys = raw.map((p) => -p.lat);

  const innerW = W - PAD_X * 2;
  const innerH = H - PAD_TOP - PAD_BOTTOM;
  const spanX = Math.max(...xs) - Math.min(...xs);
  const spanY = Math.max(...ys) - Math.min(...ys);
  // A single stop, or several at the same address, has no span to scale by —
  // it just sits in the middle.
  const scale = spanX === 0 && spanY === 0 ? 0 : Math.min(
    spanX === 0 ? Infinity : innerW / spanX,
    spanY === 0 ? Infinity : innerH / spanY,
  );
  const midX = (Math.max(...xs) + Math.min(...xs)) / 2;
  const midY = (Math.max(...ys) + Math.min(...ys)) / 2;

  const placed: Placed[] = raw.map((p, i) => {
    const x = W / 2 + (xs[i] - midX) * scale;
    const y = PAD_TOP + innerH / 2 + (ys[i] - midY) * scale;
    const lw = p.label.length * CHAR_W + LABEL_PAD_X * 2;
    return { x, y, label: p.label, hotel: p.hotel, lx: 0, ly: 0, lw };
  });

  // Each label tries four places around its dot and takes the first that hits
  // nothing — not another label, and not any dot, including ones whose own
  // label hasn't been placed yet. A name sitting on top of a dot is the one
  // failure a reader can't reason their way past: it hides a place and
  // mislabels another.
  const dots: Box[] = placed.map((p) => ({
    x: p.x - DOT_R - 1.5,
    y: p.y - DOT_R - 1.5,
    w: DOT_R * 2 + 3,
    h: DOT_R * 2 + 3,
  }));
  const taken: Box[] = [];
  for (const p of placed) {
    const gap = DOT_R + 5;
    const candidates: [number, number][] = [
      [p.x - p.lw / 2, p.y + gap], // below
      [p.x - p.lw / 2, p.y - gap - LABEL_H], // above
      [p.x + gap, p.y - LABEL_H / 2], // right
      [p.x - gap - p.lw, p.y - LABEL_H / 2], // left
    ];

    let best: Box | null = null;
    let bestScore = Infinity;
    for (const [cx, cy] of candidates) {
      const box: Box = {
        x: clamp(cx, 3, W - p.lw - 3),
        y: clamp(cy, 3, H - LABEL_H - 3),
        w: p.lw,
        h: LABEL_H,
      };
      const score =
        taken.filter((t) => overlaps(box, t)).length +
        dots.filter((d) => overlaps(box, d)).length;
      if (score < bestScore) {
        bestScore = score;
        best = box;
      }
      if (score === 0) break;
    }

    // Nowhere around the dot was clear — a busy day in a small box. Step the
    // label away a row at a time and take the first gap; the leader line is
    // the dot's own position, and a name a row off is still obviously its.
    if (bestScore > 0) {
      for (const dy of [LABEL_H + 3, -(LABEL_H + 3), 2 * (LABEL_H + 3), -2 * (LABEL_H + 3)]) {
        const y = best!.y + dy;
        if (y < 3 || y + LABEL_H > H - 3) continue;
        const moved = { ...best!, y };
        const score =
          taken.filter((t) => overlaps(moved, t)).length +
          dots.filter((d) => overlaps(moved, d)).length;
        if (score < bestScore) {
          bestScore = score;
          best = moved;
        }
        if (score === 0) break;
      }
    }

    p.lx = best!.x;
    p.ly = best!.y;
    taken.push(best!);
  }

  return placed;
}

/**
 * Whether the stay is close enough to belong on this day's map. Even with the
 * right night's hotel, a day out of town — Hakone from a Tokyo base — puts the
 * bed far enough away that including it squeezes the day's own stops into a
 * smudge. The day is what the map is for, so the hotel is what gives way.
 *
 * Generous by design: twice the day's own spread, or about 5km when the day
 * barely moves, so a hotel among the stops always makes it.
 */
function nearby(hotel: [number, number], places: { lat: number; lng: number }[]): boolean {
  if (places.length === 0) return true;
  const lats = places.map((p) => p.lat);
  const lngs = places.map((p) => p.lng);
  const midLat = (Math.max(...lats) + Math.min(...lats)) / 2;
  const midLng = (Math.max(...lngs) + Math.min(...lngs)) / 2;
  const reachLat = Math.max((Math.max(...lats) - Math.min(...lats)) * 2, 0.05);
  const reachLng = Math.max((Math.max(...lngs) - Math.min(...lngs)) * 2, 0.05);
  return Math.abs(hotel[0] - midLat) <= reachLat && Math.abs(hotel[1] - midLng) <= reachLng;
}

interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

function overlaps(a: Box, b: Box): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

/** Words that can't end a label: "Shinkansen to" is a pin waiting for the rest
 *  of its sentence, where "Shinkansen" is a place on a map. */
const DANGLING = new Set(["to", "in", "at", "on", "of", "the", "a", "and", "&", "from", "for"]);

/** Map pins take the first couple of words — "Fushimi Inari shrine hike"
 *  becomes "Fushimi Inari". The full name is in the row underneath. */
function shortLabel(name: string): string {
  const clean = name.split(/[—–:(]/)[0].trim();
  const words = clean.split(/\s+/).slice(0, 2);
  if (words.length > 1 && DANGLING.has(words[words.length - 1].toLowerCase())) words.pop();
  const short = words.join(" ");
  return short.length > 18 ? `${short.slice(0, 17)}…` : short;
}
