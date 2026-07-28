import { useState } from "react";
import { Chip, Toggle } from "../ui/primitives";
import { CURRENCY_OPTIONS } from "../../hooks/useAccountPrefs";
import { convertMoney, currencyCodeFromLabel, parseMoney } from "../../utils/currency";

interface Props {
  open: boolean;
  /** Current free-text preferences from the itinerary, used to seed the form. */
  currentPreferences?: string;
  /** Account currency preference, e.g. "USD ($)" — same setting as Account → Language & region. */
  currency: string;
  onCurrencyChange: (currency: string) => void;
  onClose: () => void;
  /** The trip's current estimate, used to seed the budget field so the user
   *  edits a real number rather than guessing at one. */
  currentBudgetTotal?: string;
  /** A target the user has already set, if any. */
  budgetTarget: string | null;
  onBudgetTargetChange: (target: string | null) => void;
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
  currentBudgetTotal,
  budgetTarget,
  onBudgetTargetChange,
  onClose,
  onApply,
}: Props) {
  const code = currencyCodeFromLabel(currency);
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
  // Digits only. The currency is shown beside the field rather than typed, so
  // there's no parsing a mixed "€1,200" out of user input, and the number the
  // planner is told matches the number on screen.
  const [budget, setBudget] = useState(() => {
    const existing = budgetTarget ?? (currentBudgetTotal ? convertMoney(currentBudgetTotal, code) : "");
    return existing ? String(parseMoney(existing)?.amount ?? "") : "";
  });

  // Only a field the user actually interacted with this session gets sent —
  // separate from the value itself, since a seed-matched value is "true but
  // untouched" and shouldn't be resent as if the user had just chosen it.
  const [touched, setTouched] = useState({
    style: false,
    pace: false,
    spend: false,
    kidFriendly: false,
    avoidWalks: false,
    budget: false,
  });
  function markTouched(key: keyof typeof touched) {
    setTouched((t) => ({ ...t, [key]: true }));
  }

  if (!open) return null;

  const budgetAmount = budget.trim() ? Number(budget.replace(/[^\d.]/g, "")) : null;
  const budgetValid = budgetAmount !== null && Number.isFinite(budgetAmount) && budgetAmount > 0;

  function handleApply() {
    // The target is remembered whether or not it changed anything else, so the
    // Budget screen can keep showing "against your target" afterwards.
    if (touched.budget) {
      onBudgetTargetChange(budgetValid ? `${code} ${Math.round(budgetAmount!)}` : null);
    }

    const changes = [
      touched.style && style ? `trip style "${style}"` : null,
      touched.pace && pace ? `pace "${pace}"` : null,
      touched.spend && spend ? `spending level "${spend}"` : null,
      touched.kidFriendly && kidFriendly ? "favour kid-friendly picks" : null,
      touched.avoidWalks && avoidWalks ? "avoid long walks between stops" : null,
      touched.budget && budgetValid
        ? `a total trip budget of about ${code} ${Math.round(budgetAmount!).toLocaleString("en-US")} ` +
          `— choose stops, food and stays that fit it, and return an updated budget breakdown`
        : null,
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

        <p className="hp-label hp-prefs-gap">Budget</p>
        <div className="hp-prefs-budget">
          <span className="hp-prefs-budget-code" translate="no">{code}</span>
          <input
            type="text"
            inputMode="numeric"
            value={budget}
            onChange={(e) => {
              setBudget(e.target.value.replace(/[^\d]/g, ""));
              markTouched("budget");
            }}
            placeholder="No target set"
            aria-label={`Total trip budget in ${code}`}
          />
          {budget && (
            <button
              type="button"
              className="hp-prefs-budget-clear"
              onClick={() => {
                setBudget("");
                markTouched("budget");
              }}
            >
              Clear
            </button>
          )}
        </div>
        <p className="hp-acct-note">
          What you'd like the whole trip to cost. The planner will pick stops, food and stays to fit,
          and the trip budget will show how the new plan compares.
        </p>

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
