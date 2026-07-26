import { AppleIcon } from "../../components/ui/icons";

interface Props {
  onBack: () => void;
  onAddCard: () => void;
}

/**
 * Payment methods — DEMO ONLY. The two cards below are fixed sample data, not
 * real stored payment methods; there's no card backend and "Add payment
 * method" never opens a card-entry form (see AccountScreen's toast handler).
 */
export function PaymentsScreen({ onBack, onAddCard }: Props) {
  return (
    <div className="hp-fullscreen hp-acct-sub">
      <div className="hp-acct-sub-scroll">
        <button type="button" className="hp-back-link" onClick={onBack}>
          ‹ Account
        </button>
        <h1>Payment methods</h1>

        <div className="hp-acct-cards">
          <div className="hp-acct-card is-default">
            <span className="hp-acct-card-badge">VISA</span>
            <span className="hp-acct-card-info">
              <b>Visa ·· 4921</b>
              <span>Expires 09/28 · default</span>
            </span>
            <span className="hp-acct-card-default">DEFAULT</span>
          </div>
          <div className="hp-acct-card">
            <span className="hp-acct-card-badge is-light">
              <AppleIcon size={15} />
            </span>
            <span className="hp-acct-card-info">
              <b>Apple Pay</b>
              <span>ak.saadi@gmail.com</span>
            </span>
            <span className="hp-acct-card-chevron">›</span>
          </div>
          <button type="button" className="hp-acct-add-card" onClick={onAddCard}>
            ⊕ Add payment method
          </button>
        </div>
        <p className="hp-acct-note">
          Used for Trip Passes, Premium, and any bookings you confirm. Nothing is charged without you
          tapping pay — and in this demo, nothing is charged at all.
        </p>
      </div>
    </div>
  );
}
