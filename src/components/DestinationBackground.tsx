import { resolveBackground } from "../data/destinationBackgrounds";

interface Props {
  /** The destination typed by the user; drives which photo is shown. Pass null
   *  (or nothing) to hide the background — it fades rather than cutting, so
   *  Home can hold it back until a destination has actually been committed. */
  destination?: string | null;
}

/** How visible the photo is under the paper tint. Deliberately not a prop:
 *  every screen showing this background must show it identically, and when it
 *  was tunable per screen they drifted — the loading screen ended up brighter
 *  and un-tinted, so it read as a different app for the few seconds it was up. */
const PHOTO_OPACITY = 0.72;

/**
 * Blurred, tinted background photo that reacts to the trip destination.
 * Photos live in public/assets/backgrounds/ and are mapped in
 * src/data/destinationBackgrounds.ts (default: Mount Fuji / Japan).
 * Sits behind content; text always renders over the paper tint for legibility.
 */
export function DestinationBackground({ destination }: Props) {
  const shown = Boolean(destination?.trim());
  return (
    <div className="hp-dest-bg" aria-hidden="true">
      <div
        className="hp-dest-bg-photo"
        style={{
          backgroundImage: `url("${resolveBackground(destination)}")`,
          opacity: shown ? PHOTO_OPACITY : 0,
        }}
      />
      <div className="hp-dest-bg-tint" />
    </div>
  );
}
