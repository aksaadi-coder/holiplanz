/**
 * The revenue model, in one place: plan free, pay per trip, or go unlimited.
 *
 * Everything the user is told about pricing comes from here — the plans screen,
 * the Account banner, and every in-context upgrade prompt — so a price can't be
 * $19 on one screen and $18 on another.
 *
 * DEMO: no payment is ever taken. "Buying" a Trip Pass or subscribing flips a
 * flag in localStorage (see useMembership) and nothing else. There is
 * deliberately no card capture anywhere in this flow.
 */

export const TRIP_PASS_PRICE = "$19";
export const PREMIUM_PRICE = "$49";
/**
 * Premium is billed annually, and that's structural rather than cosmetic.
 *
 * Billed monthly at $10 the Trip Pass was irrational: a single month of
 * Premium cost $10 against the pass's $19 and unlocked strictly more, so the
 * sensible move for any one trip was to subscribe, export, and cancel — and
 * the pass existed only for people who refuse subscriptions on principle.
 * Monthly also broke the "best value from 2 trips" claim badly: $120 a year
 * against $38 in passes needs ~6 trips a year to pay off, not 2.
 *
 * Annual fixes both. $49 against $57 for three passes means one trip is a
 * pass, three or more is Premium, and the crossover the card claims is the
 * crossover the arithmetic gives. There's no single month to buy as a
 * cheaper substitute for a pass.
 *
 * Keep the two in step if either price moves: the footnote on the Premium
 * tier below states the crossover, so it has to stay true.
 */
export const PREMIUM_PERIOD = "year";

/** What a paid trip unlocks — the four things a Trip Pass buys.
 *
 * Every one of these is scoped to a trip, never to the account. That's what
 * keeps the model honest in both directions: a $19 pass genuinely buys that
 * trip forever, and Premium's value is simply that every trip is already paid
 * for. There's deliberately no entitlement a pass can buy and then lose —
 * "your passport collection" on the Premium card is the sum of unlocked trips,
 * not a separate thing to charge for twice. */
export const FEATURE_LABELS = {
  aiEditing: "Unlimited AI editing",
  export: "Offline & PDF export",
  passport: "Your Trip Passport",
  budget: "Budget planner & tips",
} as const;

export type FeatureKey = keyof typeof FEATURE_LABELS;

/** One line of pitch per feature, shown when that feature is what got tapped.
 *  Written as the benefit, not the restriction — the user already knows they
 *  hit a wall, the prompt's job is to say what's on the other side. */
export const FEATURE_PITCH: Record<FeatureKey, string> = {
  aiEditing: "Reshape this trip as often as you like — swap a stop, slow the mornings, start again.",
  export: "Take the whole trip with you: a PDF for the road, and every card offline.",
  passport: "Stamp what you actually did and keep the passport to prove it.",
  budget: "See what the trip costs before you go, broken down by category.",
};

export interface PlanTier {
  key: "free" | "pass" | "premium";
  name: string;
  /** Headline price, or null for the free tier which leads with a phrase. */
  price: string | null;
  /** Sits next to the price ("one-time", "/ year") or replaces it on Free. */
  priceNote: string;
  features: string[];
  /** Italic line under the divider at the foot of the card. */
  footnote: string;
}

export const PLAN_TIERS: PlanTier[] = [
  {
    key: "free",
    name: "Free plan",
    price: null,
    priceNote: "After the first journey",
    features: [
      "Create one basic itinerary",
      "View and save trips",
      "Manual edits only",
      "Maps & Trip Info",
    ],
    footnote: "Trip Passport preview — locked until upgrade",
  },
  {
    key: "pass",
    name: "Trip Pass",
    price: TRIP_PASS_PRICE,
    priceNote: "one-time",
    features: [
      FEATURE_LABELS.aiEditing,
      FEATURE_LABELS.export,
      "Earn your Trip Passport",
      FEATURE_LABELS.budget,
    ],
    footnote: "No subscription. No auto-renewal.",
  },
  {
    key: "premium",
    name: "Premium plan",
    price: PREMIUM_PRICE,
    priceNote: `/ ${PREMIUM_PERIOD}`,
    features: [
      "Everything in Trip Pass",
      "Your passport collection",
      "Priority feature access",
      "Unlimited trips, all year",
    ],
    footnote: "Best value from 3 trips a year",
  },
];

/** The offer that runs above the tiers — the first trip is fully unlocked, so
 *  nobody meets a lock before they've seen what the app can do. */
export const FIRST_JOURNEY_HEADLINE = "Your First Journey is on Us";
export const FIRST_JOURNEY_SUB = "full access to every feature, once, on the house.";
