import { useState, type ReactNode } from "react";
import type { SavedTrip } from "../../hooks/useSavedTrips";
import type { useAccountPrefs } from "../../hooks/useAccountPrefs";
import { PinIcon } from "../../components/ui/icons";
import { PassportScreen } from "../PassportScreen";
import { UpgradeScreen } from "./UpgradeScreen";
import { NotificationsScreen } from "./NotificationsScreen";
import { PaymentsScreen } from "./PaymentsScreen";
import { LanguageScreen } from "./LanguageScreen";
import { HelpScreen } from "./HelpScreen";
import { PastTripsScreen } from "./PastTripsScreen";
import { formatDateRange } from "../../utils/passport";

interface Props {
  email: string | null;
  savedTrips: SavedTrip[];
  prefs: ReturnType<typeof useAccountPrefs>["prefs"];
  update: ReturnType<typeof useAccountPrefs>["update"];
}

type View =
  | { name: "root" }
  | { name: "upgrade" }
  | { name: "notifications" }
  | { name: "payments" }
  | { name: "language" }
  | { name: "help" }
  | { name: "pastTrips" }
  | { name: "pastPassport"; trip: SavedTrip };

/** Friendly first name from the demo session email, e.g. "ak.saadi@gmail.com" → "Ak". */
function nameFromEmail(email: string | null): string {
  if (!email) return "Traveller";
  const local = email.split("@")[0] ?? "";
  const first = local.split(/[.+_-]/)[0] ?? local;
  return first ? first[0].toUpperCase() + first.slice(1) : "Traveller";
}

/**
 * Account tab — profile, Premium upsell, past trips preview, and settings
 * (Notifications, Payment methods, Language & region, Help & support). Owns
 * a small internal view stack, the same pattern as EntryFlow / PassportScreen,
 * so none of this needs new top-level nav screens. The toast is rendered once,
 * outside the per-view branches below, so it shows no matter which view is active.
 */
export function AccountScreen({ email, savedTrips, prefs, update }: Props) {
  const [view, setView] = useState<View>({ name: "root" });
  const [toast, setToast] = useState<string | null>(null);

  function showToast(message: string) {
    setToast(message);
    setTimeout(() => setToast(null), 2600);
  }

  let content: ReactNode;

  if (view.name === "pastPassport") {
    content = (
      <PassportScreen
        itinerary={view.trip.itinerary}
        completedStopIds={new Set(view.trip.completedStopIds ?? [])}
        onBack={() => setView({ name: "pastTrips" })}
        backLabel="‹ Past trips"
      />
    );
  } else if (view.name === "upgrade") {
    content = (
      <UpgradeScreen
        onBack={() => setView({ name: "root" })}
        onStartTrial={() => {
          showToast("This is a demo — no charge, no subscription");
          setView({ name: "root" });
        }}
      />
    );
  } else if (view.name === "notifications") {
    content = (
      <NotificationsScreen prefs={prefs} update={update} onBack={() => setView({ name: "root" })} />
    );
  } else if (view.name === "payments") {
    content = (
      <PaymentsScreen
        onBack={() => setView({ name: "root" })}
        onAddCard={() => showToast("Demo only — no real cards are stored")}
      />
    );
  } else if (view.name === "language") {
    content = <LanguageScreen prefs={prefs} update={update} onBack={() => setView({ name: "root" })} />;
  } else if (view.name === "help") {
    content = <HelpScreen onBack={() => setView({ name: "root" })} />;
  } else if (view.name === "pastTrips") {
    content = (
      <PastTripsScreen
        savedTrips={savedTrips}
        onBack={() => setView({ name: "root" })}
        onOpenTrip={(trip) => setView({ name: "pastPassport", trip })}
      />
    );
  } else {
    const preview = savedTrips.slice(0, 2);
    const name = nameFromEmail(email);

    content = (
      <div className="hp-account">
        <div className="hp-acct-scroll">
          <div className="hp-acct-profile">
            <span className="hp-acct-avatar">{name[0]}</span>
            <span>
              <b>{name}</b>
              <span className="hp-acct-email">{email ?? "Not signed in"}</span>
            </span>
          </div>

          <button
            type="button"
            className="hp-acct-upgrade-banner"
            onClick={() => setView({ name: "upgrade" })}
          >
            <span className="hp-acct-upgrade-icon">
              <PinIcon size={14} />
            </span>
            <span className="hp-acct-upgrade-text">
              <b>Upgrade to Premium</b>
              <span>Unlimited trips, offline itineraries</span>
            </span>
            <span className="hp-acct-upgrade-chevron">›</span>
          </button>

          <div className="hp-acct-section-head">
            <p className="hp-label">Past trips</p>
            {savedTrips.length > 0 && (
              <span className="hp-acct-seeall" onClick={() => setView({ name: "pastTrips" })}>
                See all ›
              </span>
            )}
          </div>
          {preview.length === 0 ? (
            <p className="hp-muted">Finish a trip to start collecting passports here.</p>
          ) : (
            <div className="hp-acct-trip-list">
              {preview.map((trip) => (
                <button
                  type="button"
                  key={trip.itinerary.id}
                  className="hp-acct-trip-row"
                  onClick={() => setView({ name: "pastPassport", trip })}
                >
                  <span className="hp-acct-trip-info">
                    <b>{trip.itinerary.tripTitle}</b>
                    <span>
                      {formatDateRange(trip.itinerary.startDate, trip.itinerary.numDays) ?? "Dates tbc"}
                    </span>
                  </span>
                  <span className="hp-acct-trip-chevron">›</span>
                </button>
              ))}
            </div>
          )}

          <div className="hp-acct-settings">
            <button
              type="button"
              className="hp-acct-settings-row"
              onClick={() => setView({ name: "notifications" })}
            >
              <span className="hp-acct-settings-icon">◔</span>
              <span className="hp-acct-settings-label">Notifications</span>
              <span className="hp-acct-settings-chevron">›</span>
            </button>
            <button
              type="button"
              className="hp-acct-settings-row"
              onClick={() => setView({ name: "payments" })}
            >
              <span className="hp-acct-settings-icon">▤</span>
              <span className="hp-acct-settings-label">Payment methods</span>
              <span className="hp-acct-settings-chevron">›</span>
            </button>
            <button
              type="button"
              className="hp-acct-settings-row"
              onClick={() => setView({ name: "language" })}
            >
              <span className="hp-acct-settings-icon">⊕</span>
              <span className="hp-acct-settings-label">Language &amp; region</span>
              <span className="hp-acct-settings-chevron">›</span>
            </button>
            <button type="button" className="hp-acct-settings-row" onClick={() => setView({ name: "help" })}>
              <span className="hp-acct-settings-icon">◍</span>
              <span className="hp-acct-settings-label">Help &amp; support</span>
              <span className="hp-acct-settings-chevron">›</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // A single shared position:relative root (matching ItineraryScreen's own
  // pattern) so every sub-screen's .hp-fullscreen overlay sizes itself to the
  // tab's content area — not the whole app — and never covers the TabBar.
  return (
    <div className="hp-screen">
      {content}
      {toast && <div className="hp-passport-toast">{toast}</div>}
    </div>
  );
}
