import { useRef, useState } from "react";
import html2canvas from "html2canvas";
import type { Itinerary, StopCategory } from "../types";
import { distanceKm } from "../utils/geo";
import { BrandLogo } from "./BrandLogo";

interface Props {
  itinerary: Itinerary;
  completedStopIds: Set<string>;
  onClose: () => void;
}

const CATEGORY_ART: Record<StopCategory, { emoji: string; ink: string }> = {
  landmark: { emoji: "🏛️", ink: "#b91c1c" },
  museum: { emoji: "🖼️", ink: "#7c3aed" },
  food: { emoji: "🍽️", ink: "#d97706" },
  nature: { emoji: "🌿", ink: "#15803d" },
  shopping: { emoji: "🛍️", ink: "#db2777" },
  nightlife: { emoji: "🌙", ink: "#4338ca" },
  activity: { emoji: "🎟️", ink: "#0e7490" },
  transport: { emoji: "🚋", ink: "#475569" },
  accommodation: { emoji: "🛏️", ink: "#2563eb" },
  other: { emoji: "📍", ink: "#6b7280" },
};

function exploredKm(itinerary: Itinerary, completed: Set<string>): number {
  let km = 0;
  for (const day of itinerary.days) {
    const doneStops = day.stops.filter((s) => completed.has(s.id));
    for (let i = 1; i < doneStops.length; i++) {
      km += distanceKm(doneStops[i - 1], doneStops[i]);
    }
  }
  return km;
}

function souvenirFileName(itinerary: Itinerary): string {
  const slug = itinerary.destination.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  return `${slug || "trip"}-passport.png`;
}

export function PassportModal({ itinerary, completedStopIds, onClose }: Props) {
  const pageRef = useRef<HTMLDivElement>(null);
  const [saving, setSaving] = useState(false);

  const allStops = itinerary.days.flatMap((day) => day.stops.map((stop) => ({ stop, day })));
  const doneCount = allStops.filter(({ stop }) => completedStopIds.has(stop.id)).length;
  const km = exploredKm(itinerary, completedStopIds);

  async function handleSave() {
    if (!pageRef.current || saving) return;
    setSaving(true);
    try {
      const canvas = await html2canvas(pageRef.current, { scale: 2, backgroundColor: "#fbf6ec" });
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
      if (!blob) return;
      const file = new File([blob], souvenirFileName(itinerary), { type: "image/png" });
      const nav = navigator as Navigator & { canShare?: (data: ShareData) => boolean };
      if (nav.canShare?.({ files: [file] }) && navigator.share) {
        await navigator.share({
          files: [file],
          title: `${itinerary.destination} — Trip Passport`,
        });
        return;
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      console.error("passport souvenir failed:", err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card passport-card" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close">
          &times;
        </button>
        <div className="passport-page" ref={pageRef}>
          <div className="passport-head">
            <span className="passport-brand">
              <BrandLogo size={13} />
              Holiplanz &middot; Travel Passport
            </span>
            <h3>{itinerary.tripTitle}</h3>
            <span className="passport-sub">{itinerary.destination}</span>
          </div>
          <div className="passport-stats">
            <div>
              <strong>{itinerary.numDays}</strong>
              <span>day{itinerary.numDays === 1 ? "" : "s"}</span>
            </div>
            <div>
              <strong>
                {doneCount}/{allStops.length}
              </strong>
              <span>stops visited</span>
            </div>
            <div>
              <strong>{km < 1 ? km.toFixed(1) : Math.round(km)} km</strong>
              <span>explored</span>
            </div>
          </div>
          <div className="passport-stamps">
            {allStops.map(({ stop, day }, i) => {
              const art = CATEGORY_ART[stop.category] ?? CATEGORY_ART.other;
              const earned = completedStopIds.has(stop.id);
              const rotation = ((i * 7) % 13) - 6;
              return (
                <div
                  key={stop.id}
                  className={earned ? "passport-stamp earned" : "passport-stamp"}
                  style={
                    {
                      "--stamp-ink": art.ink,
                      "--stamp-rot": `${rotation}deg`,
                    } as React.CSSProperties
                  }
                >
                  <span className="passport-stamp-emoji">{art.emoji}</span>
                  <span className="passport-stamp-name">{stop.name}</span>
                  <span className="passport-stamp-day">Day {day.dayNumber}</span>
                </div>
              );
            })}
          </div>
          <p className="passport-foot">
            {doneCount === allStops.length && allStops.length > 0
              ? "Every stamp collected — what a trip!"
              : `${allStops.length - doneCount} stamp${allStops.length - doneCount === 1 ? "" : "s"} still waiting out there.`}
          </p>
        </div>
        <button className="spotlight-cta passport-save" onClick={handleSave} disabled={saving}>
          {saving ? "Preparing souvenir..." : "Save souvenir image"}
        </button>
      </div>
    </div>
  );
}
