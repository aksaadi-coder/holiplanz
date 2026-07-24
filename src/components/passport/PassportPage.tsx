import type { PassportData } from "../../utils/passport";
import { PinIcon } from "../ui/icons";
import { StampName } from "./StampName";

interface Props {
  data: PassportData;
  photo: string | null;
  /** Wired only on the live, interactive tab — omit for previews/captures. */
  onPhotoClick?: () => void;
}

/**
 * The passport page itself — corner category stamps, central destination
 * stamp, photo + trip fields, route line, MRZ strip. Shared by the live
 * Passport tab, the Export preview, and the off-screen capture target (see
 * PassportScreen) so all three render pixel-identically, uploaded photo
 * included — what you share/export is exactly what the tab shows.
 */
export function PassportPage({ data, photo, onPhotoClick }: Props) {
  return (
    <>
      <div className="hp-passport-head">
        <b>
          <PinIcon size={14} className="hp-passport-pin" />
          HOLIPLANZ · TRIP PASSPORT
        </b>
        <span>{data.number}</span>
      </div>

      <div className="hp-passport-stamps">
        {data.categories.map((cat, i) => {
          const p = data.stampPlacements[i];
          return (
            <div
              key={cat.category}
              className="hp-cat-stamp"
              style={{ top: p.top, left: p.left, right: p.right, transform: `rotate(${p.rotate}deg)` }}
            >
              <b>{cat.label.toUpperCase()}</b>
              <span>× {cat.count} visited</span>
            </div>
          );
        })}
        <div
          className="hp-dest-stamp-wrap"
          style={{ transform: `translateX(-50%) rotate(${data.destStampRotate}deg)` }}
        >
          <div className="hp-dest-stamp">
            <span className="hp-dest-top">ADMITTED · HOLIPLANZ</span>
            <StampName className="hp-dest-name" text={data.stampLabel} />
            <span className="hp-dest-date">✈ {data.stampDate}</span>
          </div>
        </div>
      </div>

      <p className="hp-label hp-passport-divider">
        Trip passport · {data.stampLabel.toLowerCase()}
      </p>

      <div className="hp-passport-info">
        <button
          type="button"
          className="hp-passport-photo"
          onClick={onPhotoClick}
          disabled={!onPhotoClick}
          style={photo ? { backgroundImage: `url(${photo})` } : undefined}
        >
          {!photo && (
            <>
              <span className="hp-passport-photo-icon" aria-hidden>
                ▦
              </span>
              Add a trip photo
              {onPhotoClick && <span className="hp-passport-photo-sub">or browse files</span>}
            </>
          )}
        </button>

        <div className="hp-passport-fields">
          <p className="hp-label">Trip</p>
          <b className="hp-passport-trip">{data.tripTitle}</b>
          <p className="hp-label">Type</p>
          <b className="hp-passport-type">{data.tripType}</b>
          <div className="hp-passport-durrow">
            <span>
              <span className="hp-label">Duration</span>
              <b>{data.duration}</b>
            </span>
            {data.dates && (
              <span>
                <span className="hp-label">Dates</span>
                <b>{data.dates}</b>
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="hp-passport-route">{data.route.join(" → ")}</div>

      <div className="hp-passport-mrz">
        {data.mrz[0]}
        <br />
        {data.mrz[1]}
      </div>
    </>
  );
}
