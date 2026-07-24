import { useState } from "react";

interface Props {
  onBack: () => void;
}

const FAQS = [
  {
    q: "How do I change a trip after it's made?",
    a: 'Open the itinerary and type what you want in the chat bar — "swap lunch", "slower mornings". Or drag cards to reorder and swipe left to remove.',
  },
  {
    q: "What counts towards my Trip Passport?",
    a: "Only what you confirm you actually did. Skipped plans are fine — they simply don't stamp.",
  },
  {
    q: "Does holiplanz book things for me?",
    a: "Not yet. We link you straight to the booking page with your dates filled in.",
  },
  {
    q: "Can I use my itinerary offline?",
    a: "Premium keeps every card offline. On the free plan you'll need a connection.",
  },
];

/** Help & support — FAQ accordion, faithful to the design's four questions. */
export function HelpScreen({ onBack }: Props) {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="hp-fullscreen hp-acct-sub">
      <div className="hp-acct-sub-scroll">
        <button type="button" className="hp-back-link" onClick={onBack}>
          ‹ Account
        </button>
        <h1>Help &amp; support</h1>

        <p className="hp-label">Common questions</p>
        {FAQS.map((f, i) => {
          const isOpen = open === i;
          return (
            <div key={f.q} className="hp-acct-faq" onClick={() => setOpen(isOpen ? null : i)}>
              <div className="hp-acct-faq-head">
                <b>{f.q}</b>
                <span>{isOpen ? "⌃" : "⌄"}</span>
              </div>
              {isOpen && <p className="hp-acct-faq-answer">{f.a}</p>}
            </div>
          );
        })}
        <p className="hp-acct-version">holiplanz 1.4.2 · Terms · Privacy</p>
      </div>
    </div>
  );
}
