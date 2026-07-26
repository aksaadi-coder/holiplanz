import { Sheet } from "../ui/primitives";
import {
  FEATURE_LABELS,
  FEATURE_PITCH,
  PREMIUM_PERIOD,
  PREMIUM_PRICE,
  TRIP_PASS_PRICE,
  type FeatureKey,
} from "../../data/plans";

interface Props {
  /** The locked feature that was tapped — null keeps the sheet closed. */
  feature: FeatureKey | null;
  /** Shown so it's obvious the pass buys *this* trip. Omitted for `collection`. */
  tripName?: string;
  onClose: () => void;
  onBuyTripPass: () => void;
  onSubscribePremium: () => void;
}

/**
 * The prompt behind every lock: what this feature is, and the two ways to open
 * it. Deliberately in-context rather than a jump to the plans screen — the user
 * tapped a thing they wanted, so the fastest honest path is to unlock it and
 * hand it straight back.
 *
 * Both options always appear: every entitlement is per trip, so a pass can buy
 * any of them for the trip in hand, and Premium buys all trips at once.
 *
 * DEMO: both buttons unlock immediately. No card, no charge. The copy says so
 * rather than implying a payment step that doesn't exist.
 */
export function UpgradeSheet({
  feature,
  tripName,
  onClose,
  onBuyTripPass,
  onSubscribePremium,
}: Props) {
  if (!feature) return null;

  return (
    <Sheet open onClose={onClose} title={FEATURE_LABELS[feature]}>
      <p className="hp-muted hp-upsell-pitch">{FEATURE_PITCH[feature]}</p>

      <button type="button" className="hp-upsell-option" onClick={onBuyTripPass}>
        <span className="hp-upsell-option-head">
          <b>Trip Pass</b>
          <span className="hp-upsell-price" translate="no">
            {TRIP_PASS_PRICE}
          </span>
        </span>
        <span className="hp-upsell-option-sub">
          {tripName
            ? `Unlocks ${tripName} — one-time, no subscription.`
            : "One-time, for this trip only."}
        </span>
      </button>

      <button
        type="button"
        className="hp-upsell-option is-premium"
        onClick={onSubscribePremium}
      >
        <span className="hp-upsell-option-head">
          <b>Premium</b>
          <span className="hp-upsell-price" translate="no">
            {PREMIUM_PRICE}
            <span className="hp-upsell-per"> / {PREMIUM_PERIOD}</span>
          </span>
        </span>
        <span className="hp-upsell-option-sub">
          Every trip unlocked, all year — plus your whole passport collection.
        </span>
      </button>

      <p className="hp-upsell-demo">This is a demo — nothing is charged and no card is needed.</p>

      <button type="button" className="hp-btn hp-btn-ghost hp-upsell-later" onClick={onClose}>
        Not now
      </button>
    </Sheet>
  );
}
