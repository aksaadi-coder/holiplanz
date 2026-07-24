import { Toggle } from "../../components/ui/primitives";
import type { useAccountPrefs } from "../../hooks/useAccountPrefs";

interface Props {
  prefs: ReturnType<typeof useAccountPrefs>["prefs"];
  update: ReturnType<typeof useAccountPrefs>["update"];
  onBack: () => void;
}

/** Notification toggles — demo preferences, no push backend (see useAccountPrefs). */
export function NotificationsScreen({ prefs, update, onBack }: Props) {
  return (
    <div className="hp-fullscreen hp-acct-sub">
      <div className="hp-acct-sub-scroll">
        <button type="button" className="hp-back-link" onClick={onBack}>
          ‹ Account
        </button>
        <h1>Notifications</h1>

        <p className="hp-label">Your trips</p>
        <div className="hp-acct-row">
          <span>
            Trip reminders
            <span className="hp-acct-row-sub">Day plans, the evening before</span>
          </span>
          <Toggle
            checked={prefs.notifyTrip}
            onChange={(v) => update({ notifyTrip: v })}
            label="Trip reminders"
          />
        </div>
        <div className="hp-acct-row">
          <span>
            Booking updates
            <span className="hp-acct-row-sub">Changes to stays and activities</span>
          </span>
          <Toggle
            checked={prefs.notifyBooking}
            onChange={(v) => update({ notifyBooking: v })}
            label="Booking updates"
          />
        </div>
        <div className="hp-acct-row">
          <span>
            Passport moments
            <span className="hp-acct-row-sub">When a stamp is ready to claim</span>
          </span>
          <Toggle
            checked={prefs.notifyPassport}
            onChange={(v) => update({ notifyPassport: v })}
            label="Passport moments"
          />
        </div>
      </div>
    </div>
  );
}
