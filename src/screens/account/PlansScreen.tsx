import {
  FIRST_JOURNEY_HEADLINE,
  FIRST_JOURNEY_SUB,
  PLAN_TIERS,
  type PlanTier,
} from "../../data/plans";
import type { PlanKey } from "../../hooks/useMembership";

interface Props {
  /** The account's current plan — marks the card the user is already on. */
  plan: PlanKey;
  /** True once the free first journey has been used, which is what moves the
   *  Free card from a promise to a description of where the user now stands. */
  firstJourneyUsed: boolean;
  onBack: () => void;
  onSubscribePremium: () => void;
  /** DEMO affordance: drop back to Free so the tiers can be walked through
   *  again. Not a real "cancel subscription" — there's no subscription. */
  onResetDemo: () => void;
}

/**
 * Account → Plans: the whole revenue model on one screen, in the order the
 * strategy deck puts it — the first journey free above three tiers you grow
 * into. Copy and prices come from data/plans.ts, the same source the in-context
 * upgrade prompts read, so this screen can't drift from what a lock offers.
 *
 * Trip Pass has no button here on purpose: a pass buys one specific trip, so
 * it's sold at the moment a trip needs it (see UpgradeSheet), not from a
 * settings screen with no trip in hand.
 */
export function PlansScreen({
  plan,
  firstJourneyUsed,
  onBack,
  onSubscribePremium,
  onResetDemo,
}: Props) {
  return (
    <div className="hp-fullscreen hp-acct-sub hp-plans">
      <div className="hp-acct-sub-scroll">
        <button type="button" className="hp-back-link" onClick={onBack}>
          ‹ Account
        </button>
        <h1>Plans</h1>
        <p className="hp-acct-upgrade-lead">Plan free. Pay per trip, or go unlimited.</p>

        <div className="hp-plans-first">
          <b>{FIRST_JOURNEY_HEADLINE}</b> — {FIRST_JOURNEY_SUB}
          {firstJourneyUsed && (
            <span className="hp-plans-first-used">Used — thanks for taking the first one.</span>
          )}
        </div>

        {PLAN_TIERS.map((tier) => (
          <PlanCard
            key={tier.key}
            tier={tier}
            current={plan === tier.key}
            onSubscribePremium={onSubscribePremium}
          />
        ))}

        <p className="hp-acct-note">
          A Trip Pass is bought on the trip that needs it — open a locked feature on any trip and
          it's offered there. Nothing in this demo takes payment or asks for a card.
        </p>

        <button type="button" className="hp-plans-reset" onClick={onResetDemo}>
          Reset demo plan state
        </button>
      </div>
    </div>
  );
}

function PlanCard({
  tier,
  current,
  onSubscribePremium,
}: {
  tier: PlanTier;
  current: boolean;
  onSubscribePremium: () => void;
}) {
  return (
    <div className={`hp-plan-card is-${tier.key} ${current ? "is-current" : ""}`.trim()}>
      <div className="hp-plan-card-top">
        <p className="hp-label">{tier.name}</p>
        {tier.isNew && <span className="hp-plan-new">NEW</span>}
        {current && <span className="hp-plan-current">CURRENT</span>}
      </div>

      <div className="hp-plan-price">
        {tier.price ? (
          <>
            <b translate="no">{tier.price}</b>
            <span translate="no">{tier.priceNote}</span>
          </>
        ) : (
          <strong className="hp-plan-price-phrase">{tier.priceNote}</strong>
        )}
      </div>

      <ul className="hp-plan-features">
        {tier.features.map((feature) => (
          <li key={feature}>
            <span aria-hidden>–</span>
            {feature}
          </li>
        ))}
      </ul>

      <p className="hp-plan-footnote">{tier.footnote}</p>

      {tier.key === "premium" && !current && (
        <button type="button" className="hp-plan-cta" onClick={onSubscribePremium}>
          Go Premium
        </button>
      )}
    </div>
  );
}
