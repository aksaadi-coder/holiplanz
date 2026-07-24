interface Props {
  onCopyLink: () => void;
  onMessage: () => void;
  onEmail: () => void;
  onExportPdf: () => void;
  onClose: () => void;
}

/**
 * Bottom-sheet share options for the trip passport. "Message it" uses the
 * native share sheet (image), "Copy link" / "Email it" are demo actions (no
 * share backend — see passportExport). "Export as PDF" opens the Export screen.
 */
export function ShareSheet({ onCopyLink, onMessage, onEmail, onExportPdf, onClose }: Props) {
  return (
    <div className="hp-sheet-scrim" onClick={onClose}>
      <div
        className="hp-share-sheet"
        role="dialog"
        aria-label="Share your passport"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="hp-share-grip" />
        <b className="hp-share-title">Share your passport</b>
        <p className="hp-share-sub">A stamped page anyone can open — no app needed.</p>

        <button type="button" className="hp-share-row" onClick={onCopyLink}>
          <span className="hp-share-row-icon" aria-hidden>
            ⧉
          </span>
          Copy link
        </button>
        <button type="button" className="hp-share-row" onClick={onMessage}>
          <span className="hp-share-row-icon" aria-hidden>
            ◱
          </span>
          Message it
        </button>
        <button type="button" className="hp-share-row" onClick={onEmail}>
          <span className="hp-share-row-icon" aria-hidden>
            ✉
          </span>
          Email it
        </button>
        <button type="button" className="hp-share-row is-strong" onClick={onExportPdf}>
          <span className="hp-share-row-icon" aria-hidden>
            ↓
          </span>
          Export as PDF →
        </button>
      </div>
    </div>
  );
}
