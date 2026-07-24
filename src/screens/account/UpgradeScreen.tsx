interface Props {
  onBack: () => void;
  /** DEMO ONLY — no subscription or charge is ever created. */
  onStartTrial: () => void;
}

/** "Go Premium" — static feature pitch. See onStartTrial: no real subscription happens. */
export function UpgradeScreen({ onBack, onStartTrial }: Props) {
  return (
    <div className="hp-fullscreen hp-acct-sub hp-acct-upgrade">
      <div className="hp-acct-sub-scroll">
        <button type="button" className="hp-back-link" onClick={onBack}>
          ‹ Account
        </button>
        <h1>Go Premium</h1>
        <p className="hp-acct-upgrade-lead">First month free, then €6/month. Cancel any time.</p>

        <div className="hp-acct-upgrade-list">
          <div className="hp-acct-upgrade-item">
            <span>✓</span>
            <span>
              <b>Unlimited trips</b> — plan as many as you like
            </span>
          </div>
          <div className="hp-acct-upgrade-item">
            <span>✓</span>
            <span>
              <b>Offline itineraries</b> — every card, no signal needed
            </span>
          </div>
          <div className="hp-acct-upgrade-item">
            <span>✓</span>
            <span>
              <b>Print-quality passports</b> — export at full resolution
            </span>
          </div>
          <div className="hp-acct-upgrade-item">
            <span>✓</span>
            <span>
              <b>Priority planning</b> — itineraries in seconds
            </span>
          </div>
        </div>

        <p className="hp-acct-upgrade-footnote">
          Your first trip stays free either way — that's the deal.
        </p>
      </div>

      <button type="button" className="hp-acct-upgrade-cta" onClick={onStartTrial}>
        Start free month
      </button>
      <button type="button" className="hp-acct-upgrade-later" onClick={onBack}>
        Maybe later
      </button>
    </div>
  );
}
