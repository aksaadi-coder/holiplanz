import {
  FIRST_JOURNEY_HEADLINE,
  FIRST_JOURNEY_SUB,
  PLAN_TIERS,
  PREMIUM_PERIOD,
  PREMIUM_PRICE,
  TRIP_PASS_PRICE,
  type PlanTier,
} from "../../data/plans";
import type { Membership } from "../../hooks/useMembership";

/** The trip a Trip Pass would apply to. A pass buys one trip, so the card can
 *  only offer one when there's a trip in hand to name. */
export interface PassTarget {
  id: string;
  /** City name, for copy that says which trip is being bought. */
  name: string;
}

interface Props {
  membership: Membership;
  activeTrip: PassTarget | null;
  onBack: () => void;
  /** Confirms each change, since none of them navigate anywhere. */
  onToast: (message: string) => void;
}

/** What the button on a card does, resolved per tier. A null action means the
 *  card has nothing to offer right now and shows `note` instead — better than a
 *  dead button the user has to guess about. */
interface CardAction {
  label: string;
  run: () => void;
  /** Leaving a plan is styled as a quiet outline rather than a filled CTA. */
  leaving?: boolean;
}

/**
 * Account → Plans: the whole revenue model on one screen, in the order the
 * strategy deck puts it — the first journey free above three tiers you move
 * between freely. Every tier can be joined and left from here, so no state is
 * a dead end.
 *
 * Copy and prices come from data/plans.ts, the same source the in-context
 * upgrade prompts read, so this screen can't drift from what a lock offers.
 */
export function PlansScreen({ membership, activeTrip, onBack, onToast }: Props) {
  // Specifically "owns a pass on this trip", not merely "this trip is open" —
  // the free first journey and Premium both open a trip without a pass, and
  // only a pass is a thing you can release.
  const passOnActiveTrip = membership.hasTripPass(activeTrip?.id);
  const activeTripIsFree = activeTrip !== null && membership.isFirstJourney(activeTrip.id);

  /** Free is where you land by cancelling Premium; passes are bought outright
   *  and survive it, so this never takes one away. */
  function freeAction(): CardAction | null {
    if (!membership.premium) return null;
    return {
      label: "Switch to the free plan",
      leaving: true,
      run: () => {
        membership.cancelPremium();
        onToast("Premium cancelled — any Trip Passes you own are unaffected");
      },
    };
  }

  function passAction(): CardAction | null {
    if (membership.premium) return null;
    if (!activeTrip) return null;
    if (passOnActiveTrip) {
      return {
        label: `Release the ${activeTrip.name} pass`,
        leaving: true,
        run: () => {
          membership.releaseTripPass(activeTrip.id);
          onToast(`${activeTrip.name} is locked again`);
        },
      };
    }
    if (activeTripIsFree) return null;
    return {
      label: `Get a pass for ${activeTrip.name} — ${TRIP_PASS_PRICE}`,
      run: () => {
        membership.buyTripPass(activeTrip.id);
        onToast(`${activeTrip.name} unlocked — demo only, nothing was charged`);
      },
    };
  }

  function premiumAction(): CardAction {
    if (membership.premium) {
      return {
        label: "Cancel Premium",
        leaving: true,
        run: () => {
          membership.cancelPremium();
          onToast("Premium cancelled — back to the free plan");
        },
      };
    }
    return {
      label: `Go Premium — ${PREMIUM_PRICE}/${PREMIUM_PERIOD}`,
      run: () => {
        membership.subscribePremium();
        onToast("Premium unlocked — demo only, nothing was charged");
      },
    };
  }

  /** Why a card has no button, when that needs saying. */
  function note(key: PlanTier["key"]): string | null {
    if (key === "pass") {
      if (membership.premium) return "Included with Premium — every trip is already unlocked.";
      if (!activeTrip) return "Plan a trip first, then a pass can be bought for it.";
      if (activeTripIsFree) return `${activeTrip.name} is your free first journey — already unlocked.`;
    }
    return null;
  }

  const actions: Record<PlanTier["key"], CardAction | null> = {
    free: freeAction(),
    pass: passAction(),
    premium: premiumAction(),
  };

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
          {membership.firstJourneyUsed && (
            <span className="hp-plans-first-used">Used — thanks for taking the first one.</span>
          )}
        </div>

        {PLAN_TIERS.map((tier) => (
          <PlanCard
            key={tier.key}
            tier={tier}
            current={
              tier.key === "pass" ? passOnActiveTrip : membership.plan === tier.key
            }
            currentLabel={tier.key === "pass" ? "ON THIS TRIP" : "CURRENT"}
            action={actions[tier.key]}
            note={note(tier.key)}
          />
        ))}

        <p className="hp-acct-note">
          Nothing here takes payment or asks for a card. Switching plans is instant and can be
          undone from this screen at any time.
        </p>

        <button
          type="button"
          className="hp-plans-reset"
          onClick={() => {
            membership.resetMembership();
            onToast("Plan state reset — the free first journey is available again");
          }}
        >
          Reset all plan state
        </button>
      </div>
    </div>
  );
}

function PlanCard({
  tier,
  current,
  currentLabel,
  action,
  note,
}: {
  tier: PlanTier;
  current: boolean;
  currentLabel: string;
  action: CardAction | null;
  note: string | null;
}) {
  return (
    <div className={`hp-plan-card is-${tier.key} ${current ? "is-current" : ""}`.trim()}>
      <div className="hp-plan-card-top">
        <p className="hp-label">{tier.name}</p>
        {current && <span className="hp-plan-current">{currentLabel}</span>}
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

      {action && (
        <button
          type="button"
          className={`hp-plan-cta ${action.leaving ? "is-leaving" : ""}`.trim()}
          onClick={action.run}
        >
          {action.label}
        </button>
      )}
      {!action && note && <p className="hp-plan-note">{note}</p>}
    </div>
  );
}
