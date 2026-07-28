import type { TripBudget } from "../../types";
import {
  convertMoney,
  currencyCodeFromLabel,
  diffMoney,
  formatMoney,
  parseMoney,
} from "../../utils/currency";
import { Value } from "../ui/primitives";

interface Props {
  open: boolean;
  budget: TripBudget | undefined;
  /** The budget as it stood before the most recent edit, if there was one.
   *  Drives the whole before/after layer below. */
  previousBudget?: TripBudget | null;
  /** What the user asked the trip to cost, e.g. "EUR 1200". */
  target?: string | null;
  /** Account currency preference, e.g. "USD ($)" — converts the figures below. */
  currency: string;
  onClose: () => void;
  onOpenPreferences: () => void;
}

/**
 * Full-screen "Trip budget" with a per-category breakdown.
 *
 * When an edit has changed the numbers, the screen's job stops being "what does
 * this cost" and becomes "what did that do" — so each figure carries its change
 * and each bar keeps a marker where it used to sit. Direction is never carried
 * by colour alone: every delta is signed, and the marker is visible regardless.
 */
export function BudgetScreen({
  open,
  budget,
  previousBudget,
  target,
  currency,
  onClose,
  onOpenPreferences,
}: Props) {
  if (!open) return null;

  const code = currencyCodeFromLabel(currency);
  const totalDelta =
    budget && previousBudget ? diffMoney(previousBudget.total, budget.total, code) : null;

  // Matched by label — the model returns the same category names across an
  // edit, and anything it renames or drops simply shows no delta rather than
  // being mismatched against the wrong row.
  const previousLines = new Map((previousBudget?.lines ?? []).map((l) => [l.label, l]));

  const targetAmount = target ? parseMoney(convertMoney(target, code))?.amount ?? null : null;
  const currentAmount = budget ? parseMoney(convertMoney(budget.total, code))?.amount ?? null : null;
  // Bundled together so the formatted target and the comparison can't get out
  // of step, and so TypeScript knows both exist wherever either is rendered.
  const versusTarget =
    targetAmount !== null && currentAmount !== null
      ? {
          label: formatMoney(targetAmount, code),
          delta: diffMoney(`${code} ${targetAmount}`, `${code} ${currentAmount}`, code),
        }
      : null;

  const anyMixMoved = (budget?.lines ?? []).some((line) => {
    const before = previousLines.get(line.label);
    return before !== undefined && Math.abs(before.share - line.share) >= 1;
  });

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

            {totalDelta && totalDelta.direction !== "same" && (
              <p className={`hp-budget-delta is-${totalDelta.direction}`}>
                <Value>{totalDelta.label}</Value> since your last change
                {totalDelta.percent !== null && (
                  <>
                    {" · "}
                    <Value>{`${Math.abs(totalDelta.percent)}%`}</Value>{" "}
                    {totalDelta.direction === "up" ? "more" : "less"}
                  </>
                )}
              </p>
            )}

            {versusTarget?.delta && (
              <p className={`hp-budget-target is-${versusTarget.delta.direction}`}>
                Target <Value>{versusTarget.label}</Value>
                {versusTarget.delta.direction === "same" ? (
                  " — exactly on it"
                ) : (
                  <>
                    {" — "}
                    <Value>{versusTarget.delta.label.replace(/^[+−]/, "")}</Value>{" "}
                    {versusTarget.delta.direction === "up" ? "over" : "under"}
                  </>
                )}
              </p>
            )}

            <p className="hp-budget-summary" key={budget.summary}>
              {budget.summary}
            </p>

            <div className="hp-budget-lines">
              {budget.lines.map((line) => {
                const before = previousLines.get(line.label);
                const delta = before ? diffMoney(before.amount, line.amount, code) : null;
                const shifted = delta && delta.direction !== "same";
                // The marker answers a different question from the figure beside
                // it: the figure says what this category now costs, the marker
                // says whether its share of the trip moved. Trimming everything
                // by a quarter changes every amount and no share — drawing a
                // marker on top of the fill edge there would look like a glitch
                // and claim a change in the mix that didn't happen.
                const mixMoved = before !== undefined && Math.abs(before.share - line.share) >= 1;
                return (
                  <div key={line.label}>
                    <div className="hp-budget-line-head">
                      <b>{line.label}</b>
                      <span className="hp-budget-line-figures">
                        {shifted && (
                          <span className={`hp-budget-line-delta is-${delta.direction}`}>
                            <Value>{delta.label}</Value>
                          </span>
                        )}
                        <span translate="no">{convertMoney(line.amount, code)}</span>
                      </span>
                    </div>
                    <div className="hp-budget-track">
                      <div
                        className="hp-budget-fill"
                        style={{ width: `${Math.max(0, Math.min(100, line.share))}%` }}
                      />
                      {/* Where this category's share sat before the edit. */}
                      {mixMoved && before && (
                        <span
                          className="hp-budget-was"
                          style={{ left: `${Math.max(0, Math.min(100, before.share))}%` }}
                          aria-hidden
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {anyMixMoved && (
              <p className="hp-budget-legend">
                The line marks where a category's share of the trip sat before your last change.
              </p>
            )}

            {budget.note && <div className="hp-budget-note">{budget.note}</div>}
          </>
        ) : (
          <p className="hp-muted hp-budget-summary">
            No budget yet for this trip — it's added when a trip is generated. Ask in chat for an
            estimate, or plan a new trip to see the full breakdown.
          </p>
        )}

        <button type="button" className="hp-budget-prefs" onClick={onOpenPreferences}>
          {target ? "Change your budget in preferences →" : "Set a budget in preferences →"}
        </button>
      </div>
    </div>
  );
}
