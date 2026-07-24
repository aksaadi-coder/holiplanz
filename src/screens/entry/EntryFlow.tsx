import { useRef, useState } from "react";
import { AppleIcon, GoogleIcon, EmailIcon, PinIcon } from "../../components/ui/icons";

type Step = "splash" | "login" | "email" | "verify" | "onboarding";

interface Props {
  /** Called when the entry flow finishes; email is the demo address if given. */
  onDone: (email?: string) => void;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Simulated sign-in / onboarding flow — the app's front door.
 * DEMO ONLY: no password is collected, the six-digit code is never validated
 * (any digits pass), and no email is ever sent. See useSession.
 */
export function EntryFlow({ onDone }: Props) {
  const [step, setStep] = useState<Step>("splash");
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState(false);
  const [code, setCode] = useState("");
  const codeInputRef = useRef<HTMLInputElement>(null);

  function submitEmail() {
    if (!EMAIL_RE.test(email.trim())) {
      setEmailError(true);
      return;
    }
    setEmailError(false);
    setCode("");
    setStep("verify");
  }

  switch (step) {
    case "splash":
      return <Splash onContinue={() => setStep("login")} />;

    case "login":
      return (
        <Login
          onEmail={() => setStep("email")}
          onSocial={() => setStep("onboarding")}
          onSkip={() => onDone()}
        />
      );

    case "email":
      return (
        <div className="hp-entry hp-entry-paper hp-entry-fade">
          <div className="hp-entry-scroll">
            <span className="hp-entry-back" onClick={() => setStep("login")}>
              ‹ Back
            </span>
            <h1 className="hp-entry-h1">Sign in with email</h1>
            <p className="hp-entry-sub">
              We'll send you a six-digit code — no password to remember.
            </p>
            <p className="hp-label">Email</p>
            <div className={`hp-entry-field ${emailError ? "is-error" : ""}`}>
              <EmailIcon size={17} className="hp-entry-field-icon" />
              <input
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (emailError) setEmailError(false);
                }}
                onKeyDown={(e) => e.key === "Enter" && submitEmail()}
                placeholder="you@example.com"
                type="email"
                autoComplete="email"
                autoFocus
              />
            </div>
            {emailError && (
              <p className="hp-entry-error">That doesn't look like an email — check for typos.</p>
            )}
          </div>
          <button type="button" className="hp-entry-cta" onClick={submitEmail}>
            Send code
          </button>
        </div>
      );

    case "verify": {
      const cells = Array.from({ length: 6 }, (_, i) => code[i] ?? "");
      const complete = code.length === 6;
      return (
        <div className="hp-entry hp-entry-paper hp-entry-fade">
          <div className="hp-entry-scroll">
            <span className="hp-entry-back" onClick={() => setStep("email")}>
              ‹ Back
            </span>
            <h1 className="hp-entry-h1">Check your inbox</h1>
            <p className="hp-entry-sub">
              We sent a code to <b>{email || "you@example.com"}</b>
            </p>
            <div className="hp-code-row" onClick={() => codeInputRef.current?.focus()}>
              {cells.map((ch, i) => (
                <div
                  key={i}
                  className={`hp-code-cell ${i === code.length ? "is-active" : ""} ${ch ? "is-filled" : ""}`}
                >
                  {ch}
                </div>
              ))}
            </div>
            <input
              ref={codeInputRef}
              className="hp-code-input"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              inputMode="numeric"
              maxLength={6}
              aria-label="Verification code"
              autoFocus
            />
            <p className="hp-entry-note">
              Tap the boxes and type the code. Didn't get it?{" "}
              <b onClick={() => setCode("")}>Resend</b>
            </p>
            <p className="hp-entry-demo">(This is a demo — any six digits work.)</p>
          </div>
          <button
            type="button"
            className="hp-entry-cta"
            disabled={!complete}
            onClick={() => complete && setStep("onboarding")}
          >
            Verify
          </button>
        </div>
      );
    }

    case "onboarding":
      return (
        <div className="hp-entry hp-entry-paper hp-entry-fade">
          <span className="hp-entry-skip hp-onboard-skip" onClick={() => onDone(email || undefined)}>
            Skip
          </span>
          <div className="hp-onboard-center">
            <div className="hp-onboard-ring">
              <PinIcon size={42} className="hp-onboard-pin" />
            </div>
            <h1 className="hp-onboard-title">Where to?</h1>
            <p className="hp-onboard-sub">One line from you, a finished trip from us.</p>
          </div>
          <button type="button" className="hp-entry-cta" onClick={() => onDone(email || undefined)}>
            Get started
          </button>
        </div>
      );
  }
}

function Splash({ onContinue }: { onContinue: () => void }) {
  return (
    <div className="hp-entry hp-entry-coral hp-splash hp-entry-fade">
      <div className="hp-splash-motif hp-splash-grow">
        <div className="hp-splash-disc" />
        <div className="hp-splash-disc-inner" />
      </div>
      <span className="hp-splash-wordmark">holiplanz</span>
      <span className="hp-splash-headline">
        Plan less. Experience <i>More</i>
      </span>
      <button
        type="button"
        className="hp-splash-arrow"
        aria-label="Continue"
        onClick={onContinue}
      >
        {/* Bold chevron from the design (assets: 23×40, stroke 4.5, round caps). */}
        <svg
          width="20"
          height="35"
          viewBox="0 0 23 40"
          fill="none"
          stroke="#000"
          strokeWidth="4.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M2 3 L20 20.5 L2 37" />
        </svg>
      </button>
    </div>
  );
}

function Login({
  onEmail,
  onSocial,
  onSkip,
}: {
  onEmail: () => void;
  onSocial: () => void;
  onSkip: () => void;
}) {
  return (
    <div className="hp-entry hp-entry-coral hp-login">
      {/* Two paper discs grow from the splash disc's position to fill the
          screen — a "paper wipe" that continues seamlessly from the splash. */}
      <div className="hp-login-disc-a" />
      <div className="hp-login-disc-b" />
      <div className="hp-login-head">
        <span className="hp-login-title">Welcome</span>
        <span className="hp-login-sub">Sign in to start planning</span>
      </div>
      <span className="hp-entry-skip hp-login-skip" onClick={onSkip}>
        Skip
      </span>
      <div className="hp-login-buttons">
        {/* Social sign-in is simulated — completes instantly into onboarding. */}
        <button type="button" className="hp-auth-btn is-apple" onClick={onSocial}>
          <AppleIcon size={16} />
          <span>Continue with Apple</span>
        </button>
        <button type="button" className="hp-auth-btn is-light" onClick={onSocial}>
          <GoogleIcon size={16} />
          <span>Continue with Google</span>
        </button>
        <button type="button" className="hp-auth-btn is-light" onClick={onEmail}>
          <EmailIcon size={16} />
          <span>Continue with email</span>
        </button>
      </div>
    </div>
  );
}
