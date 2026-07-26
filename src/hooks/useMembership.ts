import { useCallback, useState } from "react";

const STORAGE_KEY = "holidayPlanner.membership.v1";

export type PlanKey = "free" | "pass" | "premium";

interface Persisted {
  /** The trip that used up "your first journey is on us" — fully unlocked for
   *  good. Null until a first trip has been generated, so a brand-new account
   *  is never shown a lock it hasn't had the chance to earn past. */
  firstJourneyTripId: string | null;
  /** Trips with a one-time Trip Pass. A pass buys the trip, not the account —
   *  that's what "pay per trip" and Premium's "unlimited trips" mean together. */
  tripPassTripIds: string[];
  /** Premium subscriber. DEMO: set by tapping subscribe, never by a payment. */
  premium: boolean;
}

const EMPTY: Persisted = { firstJourneyTripId: null, tripPassTripIds: [], premium: false };

function read(): Persisted {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as Partial<Persisted>;
    return {
      firstJourneyTripId: parsed.firstJourneyTripId ?? null,
      tripPassTripIds: Array.isArray(parsed.tripPassTripIds) ? parsed.tripPassTripIds : [],
      premium: Boolean(parsed.premium),
    };
  } catch {
    return EMPTY;
  }
}

function persist(next: Persisted) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* ignore quota / private-mode errors — plan just won't survive a reload */
  }
}

export interface Membership {
  /** The account-level plan. A Trip Pass is per trip, so it only reads as
   *  "pass" while the trip in hand is the one that has it. */
  plan: PlanKey;
  premium: boolean;
  /** Has the free first journey been taken? Drives copy that shouldn't still
   *  be offering something already spent. */
  firstJourneyUsed: boolean;
  /** Is this specific trip paid for (or the free first journey)? */
  isTripUnlocked: (tripId: string | null | undefined) => boolean;
  /** True when this trip is unlocked *because* it was the free one — the UI
   *  says so rather than letting the user assume they've already paid. */
  isFirstJourney: (tripId: string | null | undefined) => boolean;
  /** Claim the free first journey for a trip, if it hasn't been claimed yet.
   *  Idempotent, so calling it on every generation is safe. */
  claimFirstJourney: (tripId: string) => void;
  /** DEMO purchase — no charge, no card, just an unlock. */
  buyTripPass: (tripId: string) => void;
  /** DEMO subscribe — no charge, no card, no auto-renewal to cancel. */
  subscribePremium: () => void;
  /** Lets the demo be reset without clearing trips (Account → Plans). */
  resetMembership: () => void;
}

/**
 * Who has paid for what.
 *
 * The model, from the revenue slide: plan free, pay per trip, or go unlimited.
 * The first journey is fully unlocked so the app can prove itself; after that a
 * trip needs either its own Trip Pass or an active Premium subscription before
 * AI editing, export, the passport or the budget will open. Manual editing,
 * maps, trip info and saving trips are never gated — those are the free plan.
 *
 * DEMO ONLY: there is no billing here. buyTripPass and subscribePremium flip a
 * flag in localStorage; no card details are collected anywhere in the app.
 */
export function useMembership(): Membership {
  const [state, setState] = useState<Persisted>(read);

  const update = useCallback((patch: (prev: Persisted) => Persisted) => {
    setState((prev) => {
      const next = patch(prev);
      persist(next);
      return next;
    });
  }, []);

  const isTripUnlocked = useCallback(
    (tripId: string | null | undefined) => {
      if (state.premium) return true;
      if (!tripId) return false;
      return state.firstJourneyTripId === tripId || state.tripPassTripIds.includes(tripId);
    },
    [state],
  );

  const isFirstJourney = useCallback(
    (tripId: string | null | undefined) =>
      Boolean(tripId) &&
      state.firstJourneyTripId === tripId &&
      !state.tripPassTripIds.includes(tripId as string),
    [state],
  );

  const claimFirstJourney = useCallback(
    (tripId: string) => {
      update((prev) => (prev.firstJourneyTripId ? prev : { ...prev, firstJourneyTripId: tripId }));
    },
    [update],
  );

  const buyTripPass = useCallback(
    (tripId: string) => {
      update((prev) =>
        prev.tripPassTripIds.includes(tripId)
          ? prev
          : { ...prev, tripPassTripIds: [...prev.tripPassTripIds, tripId] },
      );
    },
    [update],
  );

  const subscribePremium = useCallback(() => {
    update((prev) => ({ ...prev, premium: true }));
  }, [update]);

  const resetMembership = useCallback(() => {
    setState(EMPTY);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  return {
    plan: state.premium ? "premium" : "free",
    premium: state.premium,
    firstJourneyUsed: state.firstJourneyTripId !== null,
    isTripUnlocked,
    isFirstJourney,
    claimFirstJourney,
    buyTripPass,
    subscribePremium,
    resetMembership,
  };
}
