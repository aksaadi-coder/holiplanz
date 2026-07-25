import { useEffect, useState } from "react";
import { StampRing, PillButton } from "../components/ui/primitives";
import { CloseIcon, PinIcon } from "../components/ui/icons";
import { DestinationBackground } from "../components/DestinationBackground";
import { fetchDestinationFacts } from "../api/wikipediaApi";
import { cityName } from "../utils/destination";

interface Props {
  destination: string;
  error: string | null;
  onCancel: () => void;
  onRetry: () => void;
}

/** Shown until the real Wikipedia-sourced facts below arrive (or if none are
 *  found for this destination) — always names the actual trip, never a
 *  hardcoded place. */
function fallbackFact(destination: string): string {
  const place = destination ? cityName(destination) : "your trip";
  return `Did you know — ${place} is about to get an itinerary crafted just for it.`;
}

/**
 * Full-screen loading state. The dashed stamp ring spins in place of a spinner;
 * facts about the actual destination (pulled from Wikipedia, so they work for
 * anywhere typed in) cycle to teach while it plans. Shows an error + retry
 * when generation fails. The actual generateItinerary call is owned by
 * App.tsx; this screen is driven by the `error` prop and the parent's loading
 * lifecycle.
 */
export function GenerationScreen({ destination, error, onCancel, onRetry }: Props) {
  const [facts, setFacts] = useState<string[]>(() => [fallbackFact(destination)]);
  const [factIx, setFactIx] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setFactIx(0);
    setFacts([fallbackFact(destination)]);
    if (!destination) return;
    fetchDestinationFacts(destination).then((fetched) => {
      if (!cancelled && fetched.length > 0) setFacts(fetched);
    });
    return () => {
      cancelled = true;
    };
  }, [destination]);

  useEffect(() => {
    if (error) return;
    const id = setInterval(() => setFactIx((i) => (i + 1) % facts.length), 8000);
    return () => clearInterval(id);
  }, [error, facts]);

  if (error) {
    return (
      <div className="hp-screen hp-generation is-error">
        <DestinationBackground destination={destination} intensity={0.72} />
        <div className="hp-gen-error-top">
          <StampRing size={150}>
            <CloseIcon className="hp-gen-error-x" size={30} />
          </StampRing>
          <div className="hp-gen-error-text">
            <h2 className="hp-display">That didn't load</h2>
            <p className="hp-muted">
              We couldn't reach our planner. Your trip details are safe — try again in a moment.
            </p>
          </div>
        </div>
        <div className="hp-generation-actions">
          <PillButton onClick={onRetry}>Try again</PillButton>
          <PillButton variant="ghost" onClick={onCancel}>
            Back to home
          </PillButton>
        </div>
      </div>
    );
  }

  return (
    <div className="hp-screen hp-generation">
      <DestinationBackground destination={destination} intensity={0.95} tint={false} />
      <div className="hp-generation-body">
        <StampRing size={132} spinning>
          <PinIcon size={34} filled className="hp-generation-pin" />
        </StampRing>
        <h2 className="hp-display">Crafting your {destination || "trip"} itinerary</h2>
        <p className="hp-muted">This usually takes 20–30 seconds</p>
        <div className="hp-fact" key={factIx}>
          {facts[factIx]}
        </div>
      </div>
      <div className="hp-generation-actions">
        <PillButton variant="ghost" onClick={onCancel}>
          Cancel
        </PillButton>
      </div>
    </div>
  );
}
