import { useState } from "react";
import { Chip, Toggle } from "../ui/primitives";
import { CURRENCY_OPTIONS } from "../../hooks/useAccountPrefs";
import { STYLE_OPTIONS } from "../../data/tripStyles";
import { convertMoney, currencyCodeFromLabel, formatMoney, parseMoney } from "../../utils/currency";

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

/** Rounds up to the nearest 1, 2 or 5 × a power of ten — so a slider's step is
 *  always a number a person would pick, in yen as readily as in euros. */
function niceStep(raw: number): number {
  const magnitude = 10 ** Math.floor(Math.log10(Math.max(raw, 1)));
  const normalised = raw / magnitude;
  const stepped = normalised <= 1 ? 1 : normalised <= 2 ? 2 : normalised <= 5 ? 5 : 10;
  return stepped * magnitude;
}

/**
 * A range around the trip's own estimate — roughly a third of it up to two and
 * a half times — so the slider lands where this particular trip actually sits
 * instead of on some fixed scale. With no estimate yet it anchors on a
 * mid-range trip converted into the display currency, which keeps it sane in
 * yen and rupees without a second rate table here.
 */
function budgetRange(estimate: number | null, code: string) {
  const anchor = estimate ?? parseMoney(convertMoney("USD 2000", code))?.amount ?? 2000;
  const step = niceStep((anchor * 2.2) / 40);
  return {
    step,
    min: Math.max(step, Math.floor((anchor * 0.3) / step) * step),
    max: Math.ceil((anchor * 2.5) / step) * step,
  };
}

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
  // The slider carries a number, not text — nothing to parse, nothing to
  // mistype, and the figure shown is exactly what the planner is told. The
  // currency it's counted in rides along, because the chips at the bottom of
  // this screen can change it while the slider is sitting there.
  const estimate = currentBudgetTotal
    ? parseMoney(convertMoney(currentBudgetTotal, code))?.amount ?? null
    : null;
  const range = budgetRange(estimate, code);
  const snap = (amount: number) => Math.round(amount / range.step) * range.step;
  const [budget, setBudget] = useState<{ amount: number | null; code: string }>(() => {
    const existing = budgetTarget
      ? parseMoney(convertMoney(budgetTarget, code))?.amount ?? null
      : estimate;
    return { amount: existing === null ? null : snap(existing), code };
  });

  // Switching currency has to move the figure, not just its symbol — a €1,200
  // target is $1,300, and leaving "1,200" on screen under a dollar sign would
  // quietly change what the user is asking for.
  if (budget.code !== code) {
    const converted =
      budget.amount === null
        ? null
        : parseMoney(convertMoney(`${budget.code} ${budget.amount}`, code))?.amount ?? null;
    setBudget({ amount: converted === null ? null : snap(converted), code });
  }

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

  const amount = budget.amount;
  const budgetValid = amount !== null && Number.isFinite(amount) && amount > 0;

  function handleApply() {
    // The target is remembered whether or not it changed anything else, so the
    // Budget screen can keep showing "against your target" afterwards.
    if (touched.budget) {
      onBudgetTargetChange(budgetValid ? `${code} ${Math.round(amount!)}` : null);
    }

    const changes = [
      touched.style && style ? `trip style "${style}"` : null,
      touched.pace && pace ? `pace "${pace}"` : null,
      touched.spend && spend ? `spending level "${spend}"` : null,
      touched.kidFriendly && kidFriendly ? "favour kid-friendly picks" : null,
      touched.avoidWalks && avoidWalks ? "avoid long walks between stops" : null,
      touched.budget && budgetValid
        ? `a total trip budget of about ${code} ${Math.round(amount!).toLocaleString("en-US")} ` +
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
          <div className="hp-prefs-budget-value">
            {amount === null ? (
              <span className="hp-prefs-budget-none">No target set</span>
            ) : (
              <b translate="no">{formatMoney(amount, code)}</b>
            )}
            {amount !== null && (
              <button
                type="button"
                className="hp-prefs-budget-clear"
                onClick={() => {
                  setBudget({ amount: null, code });
                  markTouched("budget");
                }}
              >
                Clear
              </button>
            )}
          </div>
          <input
            className="hp-prefs-budget-slider"
            type="range"
            min={range.min}
            max={range.max}
            step={range.step}
            value={amount ?? estimate ?? range.min}
            onChange={(e) => {
              setBudget({ amount: Number(e.target.value), code });
              markTouched("budget");
            }}
            aria-label={`Total trip budget in ${code}`}
          />
          <div className="hp-prefs-budget-ends" translate="no">
            <span>{formatMoney(range.min, code)}</span>
            <span>{formatMoney(range.max, code)}</span>
          </div>
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
