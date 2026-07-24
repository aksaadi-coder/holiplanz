import { useEffect, useState } from "react";
import { useReel } from "../../hooks/useReel";
import { ReelShell } from "./ReelShell";
import { StampRing } from "../ui/primitives";
import { PinIcon } from "../ui/icons";

interface Props {
  open: boolean;
  onClose: () => void;
}

const FRAME_COUNT = 3;
const TYPED_TEXT = "Tokyo";
const TYPE_INTERVAL_MS = 160;

const SAMPLE_STOPS = [
  { time: "09:00", title: "Senso-ji Temple" },
  { time: "12:30", title: "Tsukiji Outer Market" },
  { time: "18:00", title: "Shibuya Crossing" },
];

/**
 * "Plan" feature reel — a live, auto-driven mini-replay (not static images) of
 * the real Home → Generation → Itinerary flow: an auto-typed destination, the
 * actual StampRing loading spinner, then a sample of real-looking stop rows.
 */
export function PlanReel({ open, onClose }: Props) {
  const { frame, progress, handleTap } = useReel({ open, frameCount: FRAME_COUNT, onClose });
  const [typed, setTyped] = useState("");

  // Auto-type the sample destination during frame 0.
  useEffect(() => {
    if (!open || frame !== 0) return;
    setTyped("");
    let i = 0;
    const timer = setInterval(() => {
      i += 1;
      setTyped(TYPED_TEXT.slice(0, i));
      if (i >= TYPED_TEXT.length) clearInterval(timer);
    }, TYPE_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [open, frame]);

  return (
    <ReelShell
      open={open}
      onClose={onClose}
      title="Plan"
      frameCount={FRAME_COUNT}
      frame={frame}
      progress={progress}
      onTap={handleTap}
    >
      {frame === 0 && (
        <div className="hp-reel-frame" key="0">
          <div className="hp-field hp-reel-input">
            <PinIcon size={18} />
            <span>
              {typed}
              <span className="hp-reel-caret" aria-hidden />
            </span>
          </div>
          <p className="hp-reel-headline">Type where you're going</p>
          <p className="hp-reel-caption">holiplanz takes it from there</p>
        </div>
      )}

      {frame === 1 && (
        <div className="hp-reel-frame" key="1">
          <div className="hp-reel-loadcard">
            <StampRing size={20} spinning />
            <div>
              <b>Crafting your itinerary…</b>
              <p>Did you know — Tokyo has more Michelin-starred restaurants than any city on Earth.</p>
            </div>
          </div>
          <p className="hp-reel-tagline">While it plans, it teaches — no spinners here.</p>
        </div>
      )}

      {frame === 2 && (
        <div className="hp-reel-frame" key="2">
          <div className="hp-reel-stops">
            {SAMPLE_STOPS.map((stop, i) => (
              <div
                className="hp-stop-row hp-reel-stop"
                key={stop.title}
                style={{ animationDelay: `${i * 0.12}s` }}
              >
                <div className="hp-stop-row-text">
                  <span className="hp-stop-row-time">{stop.time}</span>
                  <strong>{stop.title}</strong>
                </div>
              </div>
            ))}
          </div>
          <p className="hp-reel-headline">Your full itinerary, ready</p>
          <p className="hp-reel-caption">Reorder, edit, or ask for changes anytime</p>
        </div>
      )}
    </ReelShell>
  );
}
