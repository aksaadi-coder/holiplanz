import type { ReactNode, MouseEvent as ReactMouseEvent } from "react";
import { FloatingCard, CloseCircle } from "../ui/primitives";

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  frameCount: number;
  frame: number;
  progress: number;
  onTap: (e: ReactMouseEvent<HTMLDivElement>) => void;
  children: ReactNode;
}

/**
 * Shared story chrome for feature reels — segmented progress bar, title +
 * close, tappable stage, "Tap to continue" hint. Pair with useReel (frame/
 * progress/tap logic) and a feature-specific component supplying `children`
 * for the current frame.
 */
export function ReelShell({ open, onClose, title, frameCount, frame, progress, onTap, children }: Props) {
  return (
    <FloatingCard open={open} onClose={onClose}>
      <div className="hp-reel">
        <div className="hp-reel-progress">
          {Array.from({ length: frameCount }).map((_, i) => (
            <span className="hp-reel-seg" key={i}>
              <span
                className="hp-reel-seg-fill"
                style={{ width: `${i < frame ? 100 : i === frame ? progress * 100 : 0}%` }}
              />
            </span>
          ))}
        </div>

        <div className="hp-reel-head">
          <span className="hp-reel-title">{title}</span>
          <CloseCircle onClose={onClose} />
        </div>

        <div className="hp-reel-stage" onClick={onTap}>
          <div className="hp-reel-center">{children}</div>
          <p className="hp-reel-hint">Tap to continue</p>
        </div>
      </div>
    </FloatingCard>
  );
}
