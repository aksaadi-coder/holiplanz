import { Chip } from "../../components/ui/primitives";
import {
  LANGUAGE_OPTIONS,
  CURRENCY_OPTIONS,
  UNIT_OPTIONS,
  type useAccountPrefs,
} from "../../hooks/useAccountPrefs";

interface Props {
  prefs: ReturnType<typeof useAccountPrefs>["prefs"];
  update: ReturnType<typeof useAccountPrefs>["update"];
  onBack: () => void;
}

/**
 * Language & region — demo preferences (see useAccountPrefs). Choosing a
 * language here doesn't retranslate the app yet; itineraries always come back
 * in the local language of each place, as noted below.
 */
export function LanguageScreen({ prefs, update, onBack }: Props) {
  return (
    <div className="hp-fullscreen hp-acct-sub">
      <div className="hp-acct-sub-scroll">
        <button type="button" className="hp-back-link" onClick={onBack}>
          ‹ Account
        </button>
        <h1>Language &amp; region</h1>

        <p className="hp-label">App language</p>
        <div className="hp-chip-group">
          {LANGUAGE_OPTIONS.map((o) => (
            <Chip key={o} label={o} selected={prefs.language === o} onClick={() => update({ language: o })} />
          ))}
        </div>

        <p className="hp-label hp-acct-gap">Currency</p>
        <div className="hp-chip-group">
          {CURRENCY_OPTIONS.map((o) => (
            <Chip key={o} label={o} selected={prefs.currency === o} onClick={() => update({ currency: o })} />
          ))}
        </div>

        <p className="hp-label hp-acct-gap">Units</p>
        <div className="hp-chip-group">
          {UNIT_OPTIONS.map((o) => (
            <Chip key={o} label={o} selected={prefs.units === o} onClick={() => update({ units: o })} />
          ))}
        </div>

        <p className="hp-acct-note">
          Budgets and distances update everywhere — itineraries stay in the local language of each
          place.
        </p>
      </div>
    </div>
  );
}
