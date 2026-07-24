import { useEffect, useState } from "react";
import { useReel } from "../../hooks/useReel";
import { ReelShell } from "./ReelShell";
import { Chip, Toggle } from "../ui/primitives";
import { ArrowUpIcon } from "../ui/icons";

interface Props {
  open: boolean;
  onClose: () => void;
}

const FRAME_COUNT = 3;
const STYLE_OPTIONS = ["Family getaway", "Adventurous", "Romantic", "Relaxed"];
const SELECT_DELAY_MS = 900;
const TOGGLE_DELAY_MS = 900;
const TYPED_TEXT = "More museums, less shopping";
const TYPE_INTERVAL_MS = 55;

/**
 * "Personalise" feature reel — the real Chip and Toggle components (auto-
 * scripted to select/flip on), then the real chat-bar style used to ask the
 * planner for changes in plain text.
 */
export function PersonaliseReel({ open, onClose }: Props) {
  const { frame, progress, handleTap } = useReel({ open, frameCount: FRAME_COUNT, onClose });
  const [tripStyle, setTripStyle] = useState(STYLE_OPTIONS[0]);
  const [kidFriendly, setKidFriendly] = useState(false);
  const [typed, setTyped] = useState("");

  // Auto-select a different trip style partway through frame 0.
  useEffect(() => {
    if (!open || frame !== 0) return;
    setTripStyle(STYLE_OPTIONS[0]);
    const timer = setTimeout(() => setTripStyle("Relaxed"), SELECT_DELAY_MS);
    return () => clearTimeout(timer);
  }, [open, frame]);

  // Auto-flip a toggle on partway through frame 1.
  useEffect(() => {
    if (!open || frame !== 1) return;
    setKidFriendly(false);
    const timer = setTimeout(() => setKidFriendly(true), TOGGLE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [open, frame]);

  // Auto-type a sample chat request during frame 2.
  useEffect(() => {
    if (!open || frame !== 2) return;
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
      title="Personalise"
      frameCount={FRAME_COUNT}
      frame={frame}
      progress={progress}
      onTap={handleTap}
    >
      {frame === 0 && (
        <div className="hp-reel-frame" key="0">
          <div className="hp-chip-group hp-reel-chips">
            {STYLE_OPTIONS.map((option) => (
              <Chip key={option} label={option} selected={tripStyle === option} onClick={() => {}} />
            ))}
          </div>
          <p className="hp-reel-headline">Pick your vibe</p>
          <p className="hp-reel-caption">Every trip starts from a style you choose</p>
        </div>
      )}

      {frame === 1 && (
        <div className="hp-reel-frame" key="1">
          <div className="hp-reel-toggles">
            <div className="hp-prefs-row">
              <span>Kid-friendly picks</span>
              <Toggle checked={kidFriendly} onChange={() => {}} label="Kid-friendly picks" />
            </div>
            <div className="hp-prefs-row">
              <span>Avoid long walks</span>
              <Toggle checked={false} onChange={() => {}} label="Avoid long walks" />
            </div>
          </div>
          <p className="hp-reel-headline">Fine-tune every detail</p>
          <p className="hp-reel-caption">Pace, spending, accessibility — all yours to set</p>
        </div>
      )}

      {frame === 2 && (
        <div className="hp-reel-frame" key="2">
          <div className="hp-chat-bar hp-reel-chat">
            <input value={typed} readOnly placeholder="Ask for anything…" />
            <span className="hp-chat-send" aria-hidden>
              <ArrowUpIcon size={18} />
            </span>
          </div>
          <p className="hp-reel-headline">Or just ask</p>
          <p className="hp-reel-caption">Your planner listens and rebuilds instantly</p>
        </div>
      )}
    </ReelShell>
  );
}
