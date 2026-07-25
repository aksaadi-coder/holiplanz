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
  // Chips reflect the trip's current preferences where we can detect them
  // (so the screen shows the truth), but nothing is pre-selected as a
  // fallback guess — an untouched field must stay untouched, otherwise
  // "Update trip" ends up re-sending a guessed style/pace/spend the user
  // never chose and the whole itinerary gets rewritten to match it.
  const seed = (currentPreferences ?? "").toLowerCase();
  const [style, setStyle] = useState<string | null>(
    () => STYLE_OPTIONS.find((o) => seed.includes(o.toLowerCase())) ?? null,
  );
  const [pace, setPace] = useState<string | null>(
    () => PACE_OPTIONS.find((o) => seed.includes(o.toLowerCase())) ?? null,
  );
  const [spend, setSpend] = useState<string | null>(
    () => SPEND_OPTIONS.find((o) => seed.includes(o.toLowerCase())) ?? null,
  );
  const [kidFriendly, setKidFriendly] = useState(() => /kid|child|family/.test(seed));
  const [avoidWalks, setAvoidWalks] = useState(false);

  // Only a field the user actually interacted with this session gets sent —
  // separate from the value itself, since a seed-matched value is "true but
  // untouched" and shouldn't be resent as if the user had just chosen it.
  const [touched, setTouched] = useState({
    style: false,
    pace: false,
    spend: false,
    kidFriendly: false,
    avoidWalks: false,
  });
  function markTouched(key: keyof typeof touched) {
    setTouched((t) => ({ ...t, [key]: true }));
  }

  if (!open) return null;

  function handleApply() {
    const changes = [
      touched.style && style ? `trip style "${style}"` : null,
      touched.pace && pace ? `pace "${pace}"` : null,
      touched.spend && spend ? `spending level "${spend}"` : null,
      touched.kidFriendly && kidFriendly ? "favour kid-friendly picks" : null,
      touched.avoidWalks && avoidWalks ? "avoid long walks between stops" : null,
    ].filter((c): c is string => Boolean(c));

    // Nothing but currency (already applied live) changed — no itinerary
    // edit to send.
    if (changes.length === 0) {
      onClose();
      return;
    }

    onApply(
      `Update my trip preferences — ${changes.join(", ")}. Adjust the itinerary to match, but keep ` +
        `everything else about the trip as-is, including the destination, number of days, and any ` +
        `preference not mentioned here.`,
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
            <Chip
              key={o}
              label={o}
              selected={style === o}
              onClick={() => {
                setStyle(o);
                markTouched("style");
              }}
            />
          ))}
        </div>

        <p className="hp-label hp-prefs-gap">Pace</p>
        <div className="hp-chip-group">
          {PACE_OPTIONS.map((o) => (
            <Chip
              key={o}
              label={o}
              selected={pace === o}
              onClick={() => {
                setPace(o);
                markTouched("pace");
              }}
            />
          ))}
        </div>

        <p className="hp-label hp-prefs-gap">Spending</p>
        <div className="hp-chip-group">
          {SPEND_OPTIONS.map((o) => (
            <Chip
              key={o}
              label={o}
              selected={spend === o}
              onClick={() => {
                setSpend(o);
                markTouched("spend");
              }}
            />
          ))}
        </div>

        <div className="hp-prefs-row">
          <span>Kid-friendly picks</span>
          <Toggle
            checked={kidFriendly}
            onChange={(v) => {
              setKidFriendly(v);
              markTouched("kidFriendly");
            }}
            label="Kid-friendly picks"
          />
        </div>
        <div className="hp-prefs-row">
          <span>Avoid long walks</span>
          <Toggle
            checked={avoidWalks}
            onChange={(v) => {
              setAvoidWalks(v);
              markTouched("avoidWalks");
            }}
            label="Avoid long walks"
          />
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
