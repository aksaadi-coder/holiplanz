import { useEffect, useState } from "react";
import { SAMPLE_TRIP } from "../../data/sampleTrip";

type Phase = "idle" | "saved" | "shelved";

// Save-and-revisit replay: the Save button flips to "Saved ✓" and the trip
// slides into the Saved trips shelf — all in your browser, no account needed.
export function SpotlightSave() {
  const [runId, setRunId] = useState(0);
  const [phase, setPhase] = useState<Phase>("idle");

  useEffect(() => {
    setPhase("idle");
    const t1 = setTimeout(() => setPhase("saved"), 1100);
    const t2 = setTimeout(() => setPhase("shelved"), 1900);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [runId]);

  const saved = phase !== "idle";

  return (
    <div className="spotlight-save-demo">
      <div className="spotlight-save-trip">
        <div>
          <strong>{SAMPLE_TRIP.tripTitle}</strong>
          <span>{SAMPLE_TRIP.destination} · {SAMPLE_TRIP.numDays} days</span>
        </div>
        <span className={saved ? "save-trip saved spotlight-save-btn" : "save-trip spotlight-save-btn"}>
          {saved ? "Saved ✓" : "Save trip"}
        </span>
      </div>
      <div className="spotlight-save-shelf">
        <h4>Saved trips</h4>
        {phase === "shelved" ? (
          <div className="saved-trip-card spotlight-shelved">
            <div className="saved-trip-info">
              <strong>{SAMPLE_TRIP.tripTitle}</strong>
              <span>{SAMPLE_TRIP.destination}</span>
              <span className="saved-trip-meta">{SAMPLE_TRIP.numDays} days · saved just now</span>
            </div>
          </div>
        ) : (
          <p className="spotlight-save-empty">Nothing saved yet…</p>
        )}
      </div>
      <p className="spotlight-save-note">
        Trips are saved right in your browser — no account, no sign-up. Reopen the app anytime and pick up
        where you left off.
      </p>
      {phase === "shelved" && (
        <button className="spotlight-replay" onClick={() => setRunId((r) => r + 1)}>
          ↻ Replay
        </button>
      )}
    </div>
  );
}
