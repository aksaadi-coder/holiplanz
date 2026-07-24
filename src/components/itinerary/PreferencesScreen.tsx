import { useState } from "react";
import { Chip, Toggle } from "../ui/primitives";
import { CURRENCY_OPTIONS } from "../../hooks/useAccountPrefs";

interface Props {
  open: boolean;
  /** Current free-text preferences from the itinerary, used to seed the form. */
  currentPreferences?: string;
  /** Account currency preference, e.g. "USD ($)" — same setting as Account → Language & region. */
  currency: string;
  onCurrencyChange: (currency: string) => void;
  onClose: () => void;
  /** Sends the rewritten preferences to the planner as a chat instruction. */
  onApply: (message: string) => void;
}

const STYLE_OPTIONS = ["Family getaway", "Adventurous", "Romantic", "Relaxed", "Cultural", "Foodie"];
const PACE_OPTIONS = ["Easy", "Balanced", "Packed"];
const SPEND_OPTIONS = ["Budget", "Mid-range", "Luxury"];

/**
 * Full-screen "Adjust preferences". Style/pace/spending are turned into a
 * single chat instruction for the planner (there's no dedicated preferences
 * API), same as every other edit in the app. Currency is the exception — it's
 * just a display setting, so it updates the shared account preference (and
 * the trip budget) immediately, without waiting for "Update trip".
 */
export function PreferencesScreen({
  open,
  currentPreferences,
  currency,
  onCurrencyChange,
  onClose,
  onApply,
}: Props) {
  const seed = (currentPreferences ?? "").toLowerCase();
  const [style, setStyle] = useState(
    () => STYLE_OPTIONS.find((o) => seed.includes(o.toLowerCase())) ?? STYLE_OPTIONS[0],
  );
  const [pace, setPace] = useState(
    () => PACE_OPTIONS.find((o) => seed.includes(o.toLowerCase())) ?? "Balanced",
  );
  const [spend, setSpend] = useState(
    () => SPEND_OPTIONS.find((o) => seed.includes(o.toLowerCase())) ?? "Mid-range",
  );
  const [kidFriendly, setKidFriendly] = useState(() => /kid|child|family/.test(seed));
  const [avoidWalks, setAvoidWalks] = useState(false);

  if (!open) return null;

  function handleApply() {
    const extras = [
      kidFriendly ? "favour kid-friendly picks" : null,
      avoidWalks ? "avoid long walks between stops" : null,
    ].filter(Boolean);

    onApply(
      `Update my trip preferences and adjust the whole itinerary to match: trip style "${style}", ` +
        `pace "${pace}", spending level "${spend}"` +
        (extras.length ? `, and ${extras.join(" and ")}` : "") +
        `. Keep the destination and number of days the same.`,
    );
    onClose();
  }

  return (
    <div className="hp-fullscreen hp-prefs">
      <div className="hp-prefs-scroll">
        <button type="button" className="hp-back-link" onClick={onClose}>
          ‹ Itinerary
        </button>

        <h1>Adjust preferences</h1>

        <p className="hp-label">Trip style</p>
        <div className="hp-chip-group">
          {STYLE_OPTIONS.map((o) => (
            <Chip key={o} label={o} selected={style === o} onClick={() => setStyle(o)} />
          ))}
        </div>

        <p className="hp-label hp-prefs-gap">Pace</p>
        <div className="hp-chip-group">
          {PACE_OPTIONS.map((o) => (
            <Chip key={o} label={o} selected={pace === o} onClick={() => setPace(o)} />
          ))}
        </div>

        <p className="hp-label hp-prefs-gap">Spending</p>
        <div className="hp-chip-group">
          {SPEND_OPTIONS.map((o) => (
            <Chip key={o} label={o} selected={spend === o} onClick={() => setSpend(o)} />
          ))}
        </div>

        <div className="hp-prefs-row">
          <span>Kid-friendly picks</span>
          <Toggle checked={kidFriendly} onChange={setKidFriendly} label="Kid-friendly picks" />
        </div>
        <div className="hp-prefs-row">
          <span>Avoid long walks</span>
          <Toggle checked={avoidWalks} onChange={setAvoidWalks} label="Avoid long walks" />
        </div>

        <p className="hp-label hp-prefs-gap">Currency</p>
        <div className="hp-chip-group">
          {CURRENCY_OPTIONS.map((o) => (
            <Chip key={o} label={o} selected={currency === o} onClick={() => onCurrencyChange(o)} />
          ))}
        </div>
        <p className="hp-acct-note">Updates the trip budget above — same setting as Account → Language &amp; region.</p>
      </div>

      <button type="button" className="hp-prefs-apply" onClick={handleApply}>
        Update trip
      </button>
    </div>
  );
}
