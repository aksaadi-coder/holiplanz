import type { useTravelerProfile } from "../../hooks/useTravelerProfile";
import { ProfileForm } from "../../components/profile/ProfileForm";

interface Props {
  profile: ReturnType<typeof useTravelerProfile>["profile"];
  update: ReturnType<typeof useTravelerProfile>["update"];
  /** Custom display name, or null when falling back to the email-derived one. */
  name: string | null;
  /** The email-derived name, shown as the placeholder so it's clear what
   *  clearing the field falls back to. */
  placeholderName: string;
  onNameChange: (name: string) => void;
  onBack: () => void;
}

/**
 * Account → Profile — the display name, plus the same field set shown during
 * first-run onboarding (see EntryFlow), editable any time. Changes apply
 * immediately, matching every other Account settings screen (no separate save
 * step). The name lives here rather than in ProfileForm because it's account
 * identity (stored on the session, cleared on logout), not a travel
 * preference — and onboarding collects it from the email instead of asking.
 */
export function ProfileScreen({
  profile,
  update,
  name,
  placeholderName,
  onNameChange,
  onBack,
}: Props) {
  return (
    <div className="hp-fullscreen hp-acct-sub">
      <div className="hp-acct-sub-scroll">
        <button type="button" className="hp-back-link" onClick={onBack}>
          ‹ Account
        </button>
        <h1 className="hp-display">Profile</h1>
        <p className="hp-acct-note">
          Helps tailor new itineraries to you — nothing here is shared beyond this device.
        </p>

        <p className="hp-label">Name</p>
        <div className="hp-field">
          <input
            value={name ?? ""}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder={placeholderName}
            aria-label="Your name"
            autoComplete="name"
          />
        </div>

        <ProfileForm profile={profile} update={update} />
      </div>
    </div>
  );
}
