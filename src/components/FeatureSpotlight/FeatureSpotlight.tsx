import { SpotlightItinerary } from "./SpotlightItinerary";
import { SpotlightMap } from "./SpotlightMap";
import { SpotlightChat } from "./SpotlightChat";
import { SpotlightSave } from "./SpotlightSave";

export type SpotlightFeature = "itinerary" | "map" | "chat" | "save";

const SPOTLIGHTS: Record<SpotlightFeature, { title: string; caption: string }> = {
  itinerary: {
    title: "AI-crafted itineraries",
    caption: "Type a destination, get a full day-by-day plan in seconds. Here's a 3-day Lisbon trip taking shape:",
  },
  map: {
    title: "Interactive map",
    caption: "Every stop is plotted with numbered pins and the day's route drawn in.",
  },
  chat: {
    title: "Tailor by chatting",
    caption: "Ask for changes in plain words and watch the plan update alongside the conversation.",
  },
  save: {
    title: "Save & revisit",
    caption: "One tap keeps a trip for later — stored privately in your browser.",
  },
};

interface Props {
  feature: SpotlightFeature;
  onClose: () => void;
  onPlanTrip: () => void;
}

export function FeatureSpotlight({ feature, onClose, onPlanTrip }: Props) {
  const { title, caption } = SPOTLIGHTS[feature];

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card spotlight-card" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close">
          &times;
        </button>
        <span className="spotlight-kicker">Feature spotlight</span>
        <h3>{title}</h3>
        <p className="spotlight-caption">{caption}</p>
        <div className="spotlight-demo">
          {feature === "itinerary" && <SpotlightItinerary />}
          {feature === "map" && <SpotlightMap />}
          {feature === "chat" && <SpotlightChat />}
          {feature === "save" && <SpotlightSave />}
        </div>
        <button className="spotlight-cta" onClick={onPlanTrip}>
          Plan my trip &rarr;
        </button>
      </div>
    </div>
  );
}
