import { useState } from "react";
import type { Itinerary } from "../types";
import type { SavedTrip } from "../hooks/useSavedTrips";
import { resolveBackground } from "../data/destinationBackgrounds";
import { formatDateRange } from "../utils/passport";
import { cityName } from "../utils/destination";
import { Value } from "../components/ui/primitives";
import { PassportScreen } from "./PassportScreen";
import { UpgradeSheet } from "../components/membership/UpgradeSheet";
import type { Membership } from "../hooks/useMembership";
import type { FeatureKey } from "../data/plans";

interface Props {
  itinerary: Itinerary | null;
  completedStopIds: Set<string>;
  savedTrips: SavedTrip[];
  /** Whether the active trip already has an earned passport (confirmed + generated). */
  isActiveSaved: boolean;
  /** Sends the active trip to "How was [city]?" so the user decides visited/skipped
   *  before a passport can be generated. */
  onOpenConfirm: () => void;
  membership: Membership;
}

/**
 * Passport tab root — a list, not a single passport. The active trip shows as
 * a pending-passport banner until it's been confirmed (see ConfirmScreen);
 * only then does it behave like any other earned passport in the list below.
 */
export function PassportListScreen({
  itinerary,
  completedStopIds,
  savedTrips,
  isActiveSaved,
  onOpenConfirm,
  membership,
}: Props) {
  const [openTrip, setOpenTrip] = useState<"active" | SavedTrip | null>(null);
  // A locked past passport offers to unlock that trip, not a subscription:
  // entitlements are per trip throughout, so a passport already paid for can
  // never become unreadable. Premium's "passport collection" is what you get
  // when every trip is unlocked at once. See FEATURE_LABELS in data/plans.ts.
  const [locked, setLocked] = useState<{ feature: FeatureKey; tripName: string; tripId: string } | null>(
    null,
  );

  if (openTrip === "active" && itinerary) {
    return (
      <PassportScreen
        itinerary={itinerary}
        completedStopIds={completedStopIds}
        onBack={() => setOpenTrip(null)}
        backLabel="‹ Passports"
        membership={membership}
      />
    );
  }
  if (openTrip && openTrip !== "active") {
    return (
      <PassportScreen
        itinerary={openTrip.itinerary}
        completedStopIds={new Set(openTrip.completedStopIds ?? [])}
        onBack={() => setOpenTrip(null)}
        backLabel="‹ Passports"
        membership={membership}
      />
    );
  }

  // The active trip already lives in savedTrips once its passport is earned
  // (see App.handleShowPassport) — drop it from the list below so it isn't
  // shown twice.
  const pastTrips = savedTrips.filter((t) => t.itinerary.id !== itinerary?.id);
  const hasAny = Boolean(itinerary) || pastTrips.length > 0;

  return (
    <div className="hp-screen hp-trips">
      <div className="hp-trips-scroll">
        <h1 className="hp-display">Trip Passport</h1>

        {!hasAny && (
          <p className="hp-muted">Plan a trip and mark what you did — your stamps appear here.</p>
        )}

        {itinerary &&
          (isActiveSaved ? (
            <section className="hp-trips-section">
              <p className="hp-label">Current trip</p>
              <button type="button" className="hp-acct-trip-row" onClick={() => setOpenTrip("active")}>
                <img src={resolveBackground(itinerary.destination)} alt="" />
                <span className="hp-acct-trip-info">
                  <b>{itinerary.tripTitle}</b>
                  <span>
                    <Value>
                      {formatDateRange(itinerary.startDate, itinerary.numDays) ?? "Dates tbc"}
                    </Value>{" "}
                    · passport earned
                  </span>
                </span>
                <span className="hp-acct-trip-chevron" aria-hidden>
                  ›
                </span>
              </button>
            </section>
          ) : (
            <button type="button" className="hp-trips-prep-banner" onClick={onOpenConfirm}>
              <span>
                Pending passport — confirm what you did on {itinerary.tripTitle} to generate it
              </span>
              <span aria-hidden>→</span>
            </button>
          ))}

        {pastTrips.length > 0 && (
          <section className="hp-trips-section">
            <p className="hp-label">Earned passports</p>
            {/* Kept listed rather than hidden while locked: the user did the
                trip, so the honest thing is to show the passport exists and
                what opens it. */}
            <div className="hp-acct-trip-list">
              {pastTrips.map((trip) => (
                <button
                  key={trip.itinerary.id}
                  type="button"
                  className="hp-acct-trip-row"
                  onClick={() =>
                    membership.isTripUnlocked(trip.itinerary.id)
                      ? setOpenTrip(trip)
                      : setLocked({
                          feature: "passport",
                          tripName: cityName(trip.itinerary.destination),
                          tripId: trip.itinerary.id,
                        })
                  }
                >
                  <img src={resolveBackground(trip.itinerary.destination)} alt="" />
                  <span className="hp-acct-trip-info">
                    <b>{trip.itinerary.tripTitle}</b>
                    <span>
                      <Value>
                        {formatDateRange(trip.itinerary.startDate, trip.itinerary.numDays) ??
                          "Dates tbc"}
                      </Value>{" "}
                      · passport earned
                      {!membership.isTripUnlocked(trip.itinerary.id) && (
                        <span className="hp-lock-pill">LOCKED</span>
                      )}
                    </span>
                  </span>
                  <span className="hp-acct-trip-chevron" aria-hidden>
                    ›
                  </span>
                </button>
              ))}
            </div>
          </section>
        )}
      </div>

      <UpgradeSheet
        feature={locked?.feature ?? null}
        tripName={locked?.tripName}
        onClose={() => setLocked(null)}
        onBuyTripPass={() => {
          if (locked) membership.buyTripPass(locked.tripId);
          setLocked(null);
        }}
        onSubscribePremium={() => {
          membership.subscribePremium();
          setLocked(null);
        }}
      />
    </div>
  );
}
