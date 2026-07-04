import { useState } from "react";
import type { FormEvent } from "react";
import { BrandLogo } from "./BrandLogo";

interface Props {
  status: "checking" | "locked" | "expired";
  error: string | null;
  onSubmit: (code: string) => void;
}

export function AccessGate({ status, error, onSubmit }: Props) {
  const [code, setCode] = useState("");
  const checking = status === "checking";

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (code.trim()) onSubmit(code.trim());
  }

  return (
    <div className="access-gate">
      <div className="hero-card">
        <span className="brand-mark">
          <BrandLogo size={16} />
          Holiplanz
        </span>
        {status === "expired" ? (
          <>
            <h1 className="access-gate-title">This preview link has expired</h1>
            <p className="subtitle">Ask whoever shared it with you for a new link.</p>
          </>
        ) : (
          <>
            <h1 className="access-gate-title">This trip planner is invite-only</h1>
            <p className="subtitle">Enter the access code you were given to continue.</p>
            <form onSubmit={handleSubmit}>
              <label>
                Access code
                <input
                  type="password"
                  placeholder="Access code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  disabled={checking}
                  autoFocus
                />
              </label>
              {error && <p className="error-text">{error}</p>}
              <button type="submit" disabled={checking || !code.trim()}>
                {checking ? "Checking..." : "Continue"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
