import { useState } from "react";
import type { GenerateItineraryRequest } from "../types";
import type { ReelFeature } from "../hooks/useAppNav";
import { DestinationBackground } from "../components/DestinationBackground";
import { Chip, Label, BottomCta } from "../components/ui/primitives";
import { PlanReel } from "../components/reels/PlanReel";
import { StayReel } from "../components/reels/StayReel";
import { PersonaliseReel } from "../components/reels/PersonaliseReel";
import { ExploreReel } from "../components/reels/ExploreReel";
import {
  PinIcon,
  ArrowRightIcon,
  PlusIcon,
  PlanFeatureIcon,
  StayFeatureIcon,
  PersonaliseFeatureIcon,
  ExploreFeatureIcon,
} from "../components/ui/icons";
import type { SVGProps, ReactElement } from "react";
import { dayLabel } from "../utils/destination";

interface Props {
  loading: boolean;
  onSubmit: (input: GenerateItineraryRequest) => void;
}

const STYLE_OPTIONS = ["Family getaway", "Adventurous", "Romantic", "Relaxed"];

type FeatureIcon = (props: SVGProps<SVGSVGElement> & { size?: number }) => ReactElement;

const FEATURES: { key: ReelFeature; title: string; sub: string; Icon: FeatureIcon }[] = [
  { key: "plan", title: "Plan", sub: "Instant trip generation", Icon: PlanFeatureIcon },
  { key: "stay", title: "Stay", sub: "Smart accommodation", Icon: StayFeatureIcon },
  { key: "personalise", title: "Personalise", sub: "Tailor it your way", Icon: PersonaliseFeatureIcon },
  { key: "explore", title: "Explore", sub: "Journey details", Icon: ExploreFeatureIcon },
];

/**
 * Home / destination input with progressive reveal:
 * destination → dates → trip-style chips (+ custom) → "Plan my trip".
 */
export function HomeScreen({ loading, onSubmit }: Props) {
  const [destination, setDestination] = useState("");
  const [destDone, setDestDone] = useState(false);
  const [datesSet, setDatesSet] = useState(false);
  const [numDays, setNumDays] = useState("");
  const [startDate, setStartDate] = useState("");
  const [tripStyle, setTripStyle] = useState(STYLE_OPTIONS[0]);
  const [customStyle, setCustomStyle] = useState("");
  const [openReel, setOpenReel] = useState<ReelFeature | null>(null);

  const hasDest = destination.trim().length > 0;
  const showDates = hasDest && destDone;
  const showStyle = showDates && datesSet;
  const canPlan = showStyle;

  function commitDest() {
    if (hasDest) setDestDone(true);
  }

  function handlePlan() {
    if (!canPlan) return;
    const style = customStyle.trim() || tripStyle;
    onSubmit({
      destination: destination.trim(),
      numDays: numDays ? Number(numDays) : undefined,
      startDate: startDate || undefined,
      preferences: style ? `Trip style: ${style}.` : undefined,
    });
  }

  return (
    <div className="hp-screen hp-home">
      <DestinationBackground destination={destDone ? destination : null} intensity={destDone ? 0.6 : 0} />

      <div className="hp-home-scroll">
        <div className="hp-wordmark">holiplanz</div>
        <h1 className="hp-display">Tell us your next destination</h1>

        <div className="hp-field">
          <PinIcon size={18} />
          <input
            value={destination}
            onChange={(e) => {
              setDestination(e.target.value);
              if (!e.target.value.trim()) setDestDone(false);
            }}
            onBlur={commitDest}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                commitDest();
                (e.target as HTMLInputElement).blur();
              }
            }}
            placeholder="Anywhere at all…"
            aria-label="Destination"
          />
        </div>

        {showDates && (
          <div className="hp-reveal">
            <button
              type="button"
              className={`hp-date-row ${datesSet ? "is-set" : ""}`.trim()}
              onClick={() => setDatesSet(true)}
            >
              <span aria-hidden>▦</span>
              {datesSet ? (
                <span>
                  {startDate ? new Date(startDate).toLocaleDateString() : "Dates"}
                  {numDays ? ` · ${dayLabel(Number(numDays))}` : ""}
                </span>
              ) : (
                <span>Add your dates</span>
              )}
            </button>
            {datesSet && (
              <div className="hp-date-inputs">
                <label>
                  Start date
                  <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </label>
                <label>
                  Days
                  <input
                    type="number"
                    min={1}
                    max={21}
                    placeholder="7"
                    value={numDays}
                    onChange={(e) => setNumDays(e.target.value)}
                  />
                </label>
              </div>
            )}
          </div>
        )}

        {showStyle && (
          <div className="hp-reveal">
            <Label>Trip style</Label>
            <div className="hp-chip-group">
              {STYLE_OPTIONS.map((option) => (
                <Chip
                  key={option}
                  label={option}
                  selected={!customStyle.trim() && tripStyle === option}
                  onClick={() => {
                    setTripStyle(option);
                    setCustomStyle("");
                  }}
                />
              ))}
            </div>
            <div className="hp-field hp-field-dashed">
              <PlusIcon size={16} />
              <input
                value={customStyle}
                onChange={(e) => setCustomStyle(e.target.value)}
                placeholder={'Tell us your own — "hiking with kids"…'}
                aria-label="Custom trip style"
              />
            </div>
          </div>
        )}

        <Label>What holiplanz does</Label>
        <div className="hp-feature-grid">
          {FEATURES.map((feature) => (
            <button
              key={feature.key}
              type="button"
              className="hp-feature-tile"
              onClick={() => setOpenReel(feature.key)}
            >
              <feature.Icon className="hp-feature-icon" size={24} />
              <div className="hp-feature-text">
                <strong>{feature.title}</strong>
                <span>{feature.sub}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {canPlan && (
        <BottomCta onClick={handlePlan} disabled={loading}>
          Plan my trip <ArrowRightIcon size={18} />
        </BottomCta>
      )}

      <PlanReel open={openReel === "plan"} onClose={() => setOpenReel(null)} />
      <StayReel open={openReel === "stay"} onClose={() => setOpenReel(null)} />
      <PersonaliseReel open={openReel === "personalise"} onClose={() => setOpenReel(null)} />
      <ExploreReel open={openReel === "explore"} onClose={() => setOpenReel(null)} />
    </div>
  );
}
