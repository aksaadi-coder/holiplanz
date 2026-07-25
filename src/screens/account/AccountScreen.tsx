import { useRef, useState, type ReactNode } from "react";
import type { useAccountPrefs } from "../../hooks/useAccountPrefs";
import type { useTravelerProfile } from "../../hooks/useTravelerProfile";
import { useProfilePhoto } from "../../hooks/useProfilePhoto";
import { PinIcon, PlusCircleIcon } from "../../components/ui/icons";
import { Sheet } from "../../components/ui/primitives";
import { UpgradeScreen } from "./UpgradeScreen";
import { NotificationsScreen } from "./NotificationsScreen";
import { PaymentsScreen } from "./PaymentsScreen";
import { LanguageScreen } from "./LanguageScreen";
import { HelpScreen } from "./HelpScreen";
import { ProfileScreen } from "./ProfileScreen";

interface Props {
  email: string | null;
  /** Custom display name, or null to fall back to the email-derived one. */
  name: string | null;
  setName: (name: string) => void;
  onSignOut: () => void;
  prefs: ReturnType<typeof useAccountPrefs>["prefs"];
  update: ReturnType<typeof useAccountPrefs>["update"];
  profile: ReturnType<typeof useTravelerProfile>["profile"];
  updateProfile: ReturnType<typeof useTravelerProfile>["update"];
}

type View =
  | { name: "root" }
  | { name: "upgrade" }
  | { name: "notifications" }
  | { name: "payments" }
  | { name: "language" }
  | { name: "help" }
  | { name: "profile" };

/** Friendly first name from the demo session email, e.g. "ak.saadi@gmail.com" → "Ak". */
function nameFromEmail(email: string | null): string {
  if (!email) return "Traveller";
  const local = email.split("@")[0] ?? "";
  const first = local.split(/[.+_-]/)[0] ?? local;
  return first ? first[0].toUpperCase() + first.slice(1) : "Traveller";
}

/**
 * Account tab — profile summary, Premium upsell, and settings (Profile,
 * Notifications, Payment methods, Language & region, Help & support). Past
 * trips live on the Trips tab, not duplicated here. Owns a small internal
 * view stack, the same pattern as EntryFlow / PassportScreen, so none of
 * this needs new top-level nav screens. The toast is rendered once, outside
 * the per-view branches below, so it shows no matter which view is active.
 */
export function AccountScreen({
  email,
  name: customName,
  setName,
  onSignOut,
  prefs,
  update,
  profile,
  updateProfile,
}: Props) {
  const [view, setView] = useState<View>({ name: "root" });
  const [toast, setToast] = useState<string | null>(null);
  const [signOutOpen, setSignOutOpen] = useState(false);
  const { photo, setPhoto } = useProfilePhoto();
  const photoInputRef = useRef<HTMLInputElement>(null);

  function showToast(message: string) {
    setToast(message);
    setTimeout(() => setToast(null), 2600);
  }

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      await setPhoto(file);
    } catch {
      showToast("Couldn't use that photo — try a different one");
    }
  }

  let content: ReactNode;

  if (view.name === "upgrade") {
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
  } else if (view.name === "profile") {
    content = (
      <ProfileScreen
        profile={profile}
        update={updateProfile}
        name={customName}
        placeholderName={nameFromEmail(email)}
        onNameChange={setName}
        onBack={() => setView({ name: "root" })}
      />
    );
  } else {
    const name = customName ?? nameFromEmail(email);

    content = (
      <div className="hp-account">
        <div className="hp-acct-scroll">
          <div className="hp-acct-profile">
            <button
              type="button"
              className="hp-acct-avatar"
              style={photo ? { backgroundImage: `url(${photo})` } : undefined}
              onClick={() => photoInputRef.current?.click()}
              aria-label={photo ? "Change profile photo" : "Add profile photo"}
            >
              {!photo && name[0]}
              <span className="hp-acct-avatar-edit" aria-hidden>
                <PlusCircleIcon size={16} />
              </span>
            </button>
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              hidden
              onChange={handlePhotoChange}
            />
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

          <div className="hp-acct-settings">
            <button
              type="button"
              className="hp-acct-settings-row"
              onClick={() => setView({ name: "profile" })}
            >
              <span className="hp-acct-settings-icon">◒</span>
              <span className="hp-acct-settings-label">Profile</span>
              <span className="hp-acct-settings-chevron">›</span>
            </button>
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

          {/* Separated from the settings list above: this signs out rather than
              opening a sub-screen, so it shouldn't read as another row of the
              same kind. Confirmed via a sheet — signing back in means redoing
              the whole email/code flow, so an accidental tap is worth
              guarding against even though nothing is deleted. */}
          <button
            type="button"
            className="hp-acct-signout"
            onClick={() => setSignOutOpen(true)}
          >
            Log out
          </button>
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

      <Sheet open={signOutOpen} onClose={() => setSignOutOpen(false)} title="Log out?">
        <p className="hp-muted hp-acct-signout-note">
          You'll go back to the sign-in screen, where you can use a different email. Your trips,
          profile and photo stay on this device.
        </p>
        <div className="hp-acct-signout-actions">
          <button
            type="button"
            className="hp-btn hp-btn-primary"
            onClick={() => {
              setSignOutOpen(false);
              onSignOut();
            }}
          >
            Log out
          </button>
          <button
            type="button"
            className="hp-btn hp-btn-ghost"
            onClick={() => setSignOutOpen(false)}
          >
            Stay signed in
          </button>
        </div>
      </Sheet>

      {toast && <div className="hp-passport-toast">{toast}</div>}
    </div>
  );
}
