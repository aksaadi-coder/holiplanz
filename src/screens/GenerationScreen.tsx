import { useEffect, useState } from "react";
import { StampRing, PillButton } from "../components/ui/primitives";
import { CloseIcon, PinIcon } from "../components/ui/icons";
import { DestinationBackground } from "../components/DestinationBackground";
import { fetchDestinationFacts } from "../api/wikipediaApi";
import { cityName } from "../utils/destination";

interface Props {
  destination: string;
  /** Trip length, when the user gave one — only used to set the wait
   *  expectation, since generation time scales with it. */
  numDays?: number;
  error: string | null;
  onCancel: () => void;
  onRetry: () => void;
}

/** Generation time scales with trip length — a 10-day trip measures around a
 *  minute and three quarters against ~35s for a short one — so a flat
 *  "20–30 seconds" was most wrong on exactly the trips that wait longest. */
function waitEstimate(numDays: number | undefined): string {
  if (!numDays || numDays <= 4) return "This usually takes 30–40 seconds";
  if (numDays <= 8) return "This usually takes about a minute";
  return "A trip this long takes a couple of minutes to plan";
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
export function GenerationScreen({ destination, numDays, error, onCancel, onRetry }: Props) {
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
        <DestinationBackground destination={destination} />
        <div className="hp-gen-error-top">
          <StampRing size={150}>
            <CloseIcon className="hp-gen-error-x" size={30} />
          </StampRing>
          <div className="hp-gen-error-text">
            <h2 className="hp-display">That didn't load</h2>
            <p className="hp-muted">{error}</p>
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
      <DestinationBackground destination={destination} />
      <div className="hp-generation-body">
        <StampRing size={132} spinning>
          <PinIcon size={34} filled className="hp-generation-pin" />
        </StampRing>
        <h2 className="hp-display">Crafting your {destination || "trip"} itinerary</h2>
        <p className="hp-muted">{waitEstimate(numDays)}</p>
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
