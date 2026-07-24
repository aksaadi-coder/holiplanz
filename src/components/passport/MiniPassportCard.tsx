import type { PassportData } from "../../utils/passport";
import { StampName } from "./StampName";

interface Props {
  data: PassportData;
  photo: string | null;
  /** Wired only on the live, interactive tab — omit for previews/captures. */
  onPhotoClick?: () => void;
}

/**
 * Compact alternative to the full PassportPage — a hero photo, the essential
 * trip fields, a small destination stamp, and the MRZ strip, all within one
 * card. For a shorter print/share page when the full passport is more than
 * needed.
 */
export function MiniPassportCard({ data, photo, onPhotoClick }: Props) {
  return (
    <div className="hp-mini-card">
      <button
        type="button"
        className="hp-mini-photo"
        onClick={onPhotoClick}
        disabled={!onPhotoClick}
        style={photo ? { backgroundImage: `url(${photo})` } : undefined}
      >
        {!photo && (
          <>
            <span className="hp-mini-photo-icon" aria-hidden>
              ▦
            </span>
            Trip photo
            {onPhotoClick && <span className="hp-mini-photo-sub">or browse files</span>}
          </>
        )}
      </button>

      <div className="hp-mini-info">
        <div className="hp-mini-head">
          <span>HOLIPLANZ · TRIP PASSPORT</span>
          <span>{data.number}</span>
        </div>
        <b className="hp-mini-title">{data.tripTitle}</b>
        <p className="hp-mini-meta">
          {data.datesWithYear ? `${data.datesWithYear} · ` : ""}
          {data.duration}
          {data.routeTitleCase.length > 0 ? ` · ${data.routeTitleCase.join(" → ")}` : ""}
        </p>
        <div className="hp-mini-stamp">
          <span className="hp-mini-stamp-top">ADMITTED · HOLIPLANZ</span>
          <StampName className="hp-mini-stamp-name" text={data.stampLabel} max={26} min={14} maxWidth={160} />
          <span className="hp-mini-stamp-date">✈ {data.stampDate}</span>
        </div>

        <div className="hp-mini-mrz">
          {data.mrz[0]}
          <br />
          {data.mrz[1]}
        </div>
      </div>
    </div>
  );
}
