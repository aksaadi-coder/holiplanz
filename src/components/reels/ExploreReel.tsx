import { useReel } from "../../hooks/useReel";
import { ReelShell } from "./ReelShell";

interface Props {
  open: boolean;
  onClose: () => void;
}

const FRAME_COUNT = 3;

const INFO_TILES = [
  { label: "Timezone", value: "GMT+9", sub: "9 hrs ahead" },
  { label: "Currency", value: "¥ JPY", sub: "≈ 0.0064 USD" },
  { label: "Language", value: "Japanese", sub: "English widely spoken" },
  { label: "Plug type", value: "Type A", sub: "100V" },
];

/**
 * "Explore" feature reel — the real stop-detail card layout (photo + blurb),
 * the real Trip-info tile grid, and the real map/directions link row, all
 * with sample data.
 */
export function ExploreReel({ open, onClose }: Props) {
  const { frame, progress, handleTap } = useReel({ open, frameCount: FRAME_COUNT, onClose });

  return (
    <ReelShell
      open={open}
      onClose={onClose}
      title="Explore"
      frameCount={FRAME_COUNT}
      frame={frame}
      progress={progress}
      onTap={handleTap}
    >
      {frame === 0 && (
        <div className="hp-reel-frame" key="0">
          <div className="hp-reel-stop-detail">
            <div className="hp-reel-photo" aria-hidden>
              ▦
            </div>
            <b>Senso-ji Temple</b>
            <p>
              Tokyo's oldest temple, founded in 645 — a lantern-lit gate opens onto a busy market street
              leading to the main hall.
            </p>
          </div>
          <p className="hp-reel-headline">Tap any stop for the story</p>
          <p className="hp-reel-caption">History, tips, and photos for every stop</p>
        </div>
      )}

      {frame === 1 && (
        <div className="hp-reel-frame" key="1">
          <div className="hp-ti-grid hp-reel-ti-grid">
            {INFO_TILES.map((tile) => (
              <div className="hp-ti-tile" key={tile.label}>
                <p className="hp-label">{tile.label}</p>
                <b>{tile.value}</b>
                <div>{tile.sub}</div>
              </div>
            ))}
          </div>
          <p className="hp-reel-headline">Know before you go</p>
          <p className="hp-reel-caption">Timezone, currency, and local tips, ready</p>
        </div>
      )}

      {frame === 2 && (
        <div className="hp-reel-frame" key="2">
          <div className="hp-cd-links hp-reel-explore-links">
            <a href="#" onClick={(e) => e.preventDefault()}>
              View on map →
            </a>
            <a href="#" onClick={(e) => e.preventDefault()}>
              Get directions →
            </a>
          </div>
          <p className="hp-reel-headline">Never get lost</p>
          <p className="hp-reel-caption">Every stop, mapped and ready</p>
        </div>
      )}
    </ReelShell>
  );
}
