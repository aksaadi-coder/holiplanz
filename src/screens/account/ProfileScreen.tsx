import type { useTravelerProfile } from "../../hooks/useTravelerProfile";
import { ProfileForm } from "../../components/profile/ProfileForm";

interface Props {
  profile: ReturnType<typeof useTravelerProfile>["profile"];
  update: ReturnType<typeof useTravelerProfile>["update"];
  onBack: () => void;
}

/**
 * Account → Profile — the same field set shown during first-run onboarding
 * (see EntryFlow), editable any time. Changes apply immediately, matching
 * every other Account settings screen (no separate save step).
 */
export function ProfileScreen({ profile, update, onBack }: Props) {
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

        <ProfileForm profile={profile} update={update} />
      </div>
    </div>
  );
}
