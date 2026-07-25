import { Chip, Toggle } from "../ui/primitives";
import {
  AGE_RANGE_OPTIONS,
  TRAVEL_STATUS_OPTIONS,
  KID_AGE_OPTIONS,
  INTEREST_OPTIONS,
  PROFILE_PACE_OPTIONS,
  PROFILE_SPEND_OPTIONS,
  type TravelerProfile,
} from "../../hooks/useTravelerProfile";

interface Props {
  profile: TravelerProfile;
  update: (patch: Partial<TravelerProfile>) => void;
}

function toggleInList(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

/**
 * The traveler profile's field set — age range, travel status, kids,
 * interests, default pace/spend, and free-text notes. Shared by the
 * first-run onboarding step and the Account → Profile settings screen, so
 * the two never drift apart.
 */
export function ProfileForm({ profile, update }: Props) {
  return (
    <>
      <p className="hp-label">Age range</p>
      <div className="hp-chip-group">
        {AGE_RANGE_OPTIONS.map((o) => (
          <Chip key={o} label={o} selected={profile.ageRange === o} onClick={() => update({ ageRange: o })} />
        ))}
      </div>

      <p className="hp-label hp-acct-gap">Travel status</p>
      <div className="hp-chip-group">
        {TRAVEL_STATUS_OPTIONS.map((o) => (
          <Chip
            key={o}
            label={o}
            selected={profile.travelStatus === o}
            onClick={() => update({ travelStatus: o })}
          />
        ))}
      </div>

      <div className="hp-prefs-row hp-acct-gap">
        <span>Traveling with kids</span>
        <Toggle
          checked={profile.hasKids}
          onChange={(v) => update({ hasKids: v, kidAges: v ? profile.kidAges : [] })}
          label="Traveling with kids"
        />
      </div>

      {profile.hasKids && (
        <div className="hp-chip-group">
          {KID_AGE_OPTIONS.map((o) => (
            <Chip
              key={o}
              label={o}
              selected={profile.kidAges.includes(o)}
              onClick={() => update({ kidAges: toggleInList(profile.kidAges, o) })}
            />
          ))}
        </div>
      )}

      <p className="hp-label hp-acct-gap">Interests</p>
      <div className="hp-chip-group">
        {INTEREST_OPTIONS.map((o) => (
          <Chip
            key={o}
            label={o}
            selected={profile.interests.includes(o)}
            onClick={() => update({ interests: toggleInList(profile.interests, o) })}
          />
        ))}
      </div>

      <p className="hp-label hp-acct-gap">Default pace</p>
      <div className="hp-chip-group">
        {PROFILE_PACE_OPTIONS.map((o) => (
          <Chip key={o} label={o} selected={profile.pace === o} onClick={() => update({ pace: o })} />
        ))}
      </div>

      <p className="hp-label hp-acct-gap">Default spending</p>
      <div className="hp-chip-group">
        {PROFILE_SPEND_OPTIONS.map((o) => (
          <Chip key={o} label={o} selected={profile.spend === o} onClick={() => update({ spend: o })} />
        ))}
      </div>

      <p className="hp-label hp-acct-gap">Notes</p>
      <div className="hp-field">
        <input
          value={profile.notes}
          onChange={(e) => update({ notes: e.target.value })}
          placeholder="Dietary needs, accessibility, anything else…"
          aria-label="Profile notes"
        />
      </div>
    </>
  );
}
