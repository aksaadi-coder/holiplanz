export interface ShareRow {
  /** Single glyph, decorative — the label carries the meaning. */
  icon: string;
  label: string;
  onClick: () => void;
  /** The one row that leads somewhere else rather than sharing from here. */
  strong?: boolean;
  disabled?: boolean;
}

interface Props {
  title: string;
  subtitle: string;
  rows: ShareRow[];
  onClose: () => void;
}

/**
 * Bottom-sheet list of ways to send something — the trip passport, or a whole
 * itinerary. The rows differ per use, so they're passed in; what's shared is
 * the scrim, the dismiss-on-tap-outside, and the shape.
 */
export function ShareSheet({ title, subtitle, rows, onClose }: Props) {
  return (
    <div className="hp-sheet-scrim" onClick={onClose}>
      <div
        className="hp-share-sheet"
        role="dialog"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="hp-share-grip" />
        <b className="hp-share-title">{title}</b>
        <p className="hp-share-sub">{subtitle}</p>

        {rows.map((row) => (
          <button
            key={row.label}
            type="button"
            className={`hp-share-row ${row.strong ? "is-strong" : ""}`.trim()}
            onClick={row.onClick}
            disabled={row.disabled}
          >
            <span className="hp-share-row-icon" aria-hidden>
              {row.icon}
            </span>
            {row.label}
          </button>
        ))}
      </div>
    </div>
  );
}
