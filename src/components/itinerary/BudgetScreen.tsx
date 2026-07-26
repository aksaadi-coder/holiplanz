import type { TripBudget } from "../../types";
import { convertMoney, currencyCodeFromLabel } from "../../utils/currency";

interface Props {
  open: boolean;
  budget: TripBudget | undefined;
  /** Account currency preference, e.g. "USD ($)" — converts the figures below. */
  currency: string;
  onClose: () => void;
  onOpenPreferences: () => void;
}

/** Full-screen "Trip budget" with a per-category breakdown. */
export function BudgetScreen({ open, budget, currency, onClose, onOpenPreferences }: Props) {
  if (!open) return null;

  const code = currencyCodeFromLabel(currency);

  return (
    <div className="hp-fullscreen hp-budget">
      <div className="hp-budget-scroll">
        <button type="button" className="hp-back-link" onClick={onClose}>
          ‹ Itinerary
        </button>

        <h1>Trip budget</h1>

        {budget ? (
          <>
            {/* Money figures change in place — a chat estimate arriving, or a
                different account currency converting them — so they're kept out
                of a translator's hands. See Value in ui/primitives. */}
            <div className="hp-budget-total" translate="no">
              {convertMoney(budget.total, code)}
            </div>
            <p className="hp-budget-summary" key={budget.summary}>
              {budget.summary}
            </p>

            <div className="hp-budget-lines">
              {budget.lines.map((line) => (
                <div key={line.label}>
                  <div className="hp-budget-line-head">
                    <b>{line.label}</b>
                    <span translate="no">{convertMoney(line.amount, code)}</span>
                  </div>
                  <div className="hp-budget-track">
                    <div
                      className="hp-budget-fill"
                      style={{ width: `${Math.max(0, Math.min(100, line.share))}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {budget.note && <div className="hp-budget-note">{budget.note}</div>}
          </>
        ) : (
          <p className="hp-muted hp-budget-summary">
            No budget yet for this trip — it's added when a trip is generated. Ask in chat for an
            estimate, or plan a new trip to see the full breakdown.
          </p>
        )}

        <button type="button" className="hp-budget-prefs" onClick={onOpenPreferences}>
          Tune it in preferences →
        </button>
      </div>
    </div>
  );
}
