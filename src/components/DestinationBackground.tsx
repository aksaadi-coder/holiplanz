import { resolveBackground } from "../data/destinationBackgrounds";

interface Props {
  /** The destination typed by the user; drives which photo is shown. */
  destination?: string | null;
  /** 0–1 how visible the photo is under the paper tint. Default 0.6 — kept
   *  the same across every screen that uses this (Home, Generation,
   *  Itinerary) for a consistent look. */
  intensity?: number;
  /** Set false for a full-bleed photo with no readability wash — only where
   *  there's no body text sitting directly on it (e.g. the loading screen,
   *  whose text lives in its own opaque fact card). Default true. */
  tint?: boolean;
}

/**
 * Blurred, tinted background photo that reacts to the trip destination.
 * Photos live in public/assets/backgrounds/ and are mapped in
 * src/data/destinationBackgrounds.ts (default: Mount Fuji / Japan).
 * Sits behind content; text always renders over the paper tint for legibility.
 */
export function DestinationBackground({ destination, intensity = 0.6, tint = true }: Props) {
  const src = resolveBackground(destination);
  return (
    <div className="hp-dest-bg" aria-hidden="true">
      <div
        className="hp-dest-bg-photo"
        style={{ backgroundImage: `url("${src}")`, opacity: intensity }}
      />
      {tint && <div className="hp-dest-bg-tint" />}
    </div>
  );
}
