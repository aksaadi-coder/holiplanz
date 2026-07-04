import { useState } from "react";
import type { FormEvent } from "react";
import type { GenerateItineraryRequest } from "../types";
import type { SavedTrip } from "../hooks/useSavedTrips";
import { HeroBackground } from "./HeroBackground";
import { BrandLogo } from "./BrandLogo";

interface Props {
  loading: boolean;
  error: string | null;
  savedTrips: SavedTrip[];
  onSubmit: (input: GenerateItineraryRequest) => void;
  onOpenSaved: (trip: SavedTrip) => void;
  onDeleteSaved: (itineraryId: string) => void;
}

const FEATURES = [
  {
    icon: (
      <path d="M4 19V5a1 1 0 0 1 1-1h9l6 6v9a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1Z M13 4v6h6" />
    ),
    title: "AI-crafted itineraries",
    description: "Tell us your destination and get a full day-by-day plan in seconds.",
  },
  {
    icon: <path d="M9 20l-6-2V6l6 2m0 12l6-2m-6 2V8m6 10l6 2V8l-6-2m0 14V6m0 0L9 8" />,
    title: "Interactive map",
    description: "See every stop plotted with routes, numbered pins, and real photos.",
  },
  {
    icon: (
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5Z" />
    ),
    title: "Tailor by chatting",
    description: "“Make day 2 more relaxed” or “we're traveling with kids” - just ask.",
  },
  {
    icon: (
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z M17 21v-8H7v8 M7 3v5h8" />
    ),
    title: "Save & revisit",
    description: "Keep as many trips as you like, saved right in your browser.",
  },
];

export function TripSetupForm({
  loading,
  error,
  savedTrips,
  onSubmit,
  onOpenSaved,
  onDeleteSaved,
}: Props) {
  const [destination, setDestination] = useState("");
  const [numDays, setNumDays] = useState("");
  const [startDate, setStartDate] = useState("");
  const [preferences, setPreferences] = useState("");
  const [includeAccommodation, setIncludeAccommodation] = useState(false);
  const [bookedAccommodation, setBookedAccommodation] = useState("");

  function handleIncludeAccommodationChange(checked: boolean) {
    setIncludeAccommodation(checked);
    if (checked) setBookedAccommodation("");
  }

  function handleBookedAccommodationChange(value: string) {
    setBookedAccommodation(value);
    if (value.trim()) setIncludeAccommodation(false);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!destination.trim()) return;
    onSubmit({
      destination: destination.trim(),
      numDays: numDays ? Number(numDays) : undefined,
      startDate: startDate || undefined,
      preferences: preferences.trim() || undefined,
      includeAccommodation: includeAccommodation || undefined,
      bookedAccommodation: bookedAccommodation.trim() || undefined,
    });
  }

  return (
    <div className="landing-page">
      <div className="hero">
        <HeroBackground />
        <div className="hero-card">
          <span className="brand-mark">
            <BrandLogo size={16} />
            Holiplanz
          </span>
          <h1>
            Where to
            <br />
            next?
          </h1>
          <p className="subtitle">Tell us your destination and we'll sketch an itinerary you can tailor.</p>
          <form onSubmit={handleSubmit}>
            <label>
              Destination
              <input
                type="text"
                placeholder="e.g. Lisbon, Portugal"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                required
                disabled={loading}
              />
            </label>
            <div className="form-row">
              <label>
                Trip length (days)
                <input
                  type="number"
                  min={1}
                  max={21}
                  placeholder="e.g. 5"
                  value={numDays}
                  onChange={(e) => setNumDays(e.target.value)}
                  disabled={loading}
                />
              </label>
              <label>
                Start date
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  disabled={loading}
                />
              </label>
            </div>
            <label>
              Preferences
              <textarea
                placeholder="e.g. traveling with kids, love food, relaxed pace, skip museums"
                value={preferences}
                onChange={(e) => setPreferences(e.target.value)}
                rows={2}
                disabled={loading}
              />
            </label>
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={includeAccommodation}
                onChange={(e) => handleIncludeAccommodationChange(e.target.checked)}
                disabled={loading || !!bookedAccommodation.trim()}
              />
              Include accommodation suggestions
            </label>
            <label>
              Already booked a hotel? (optional)
              <input
                type="text"
                placeholder="e.g. Hotel Alfonso XIII"
                value={bookedAccommodation}
                onChange={(e) => handleBookedAccommodationChange(e.target.value)}
                disabled={loading || includeAccommodation}
              />
            </label>
            {error && <p className="error-text">{error}</p>}
            <button type="submit" disabled={loading || !destination.trim()}>
              {loading ? "Planning your trip..." : "Plan my trip"}
            </button>
          </form>
          <div className="hero-trust">
            <span>✓ Free to use</span>
            <span>✓ No sign-up required</span>
          </div>
        </div>
      </div>

      <div className="feature-grid">
        {FEATURES.map((feature) => (
          <div className="feature-card" key={feature.title}>
            <svg
              className="feature-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {feature.icon}
            </svg>
            <strong>{feature.title}</strong>
            <p>{feature.description}</p>
          </div>
        ))}
      </div>

      {savedTrips.length > 0 && (
        <div className="saved-trips">
          <h2>Saved trips</h2>
          <div className="saved-trips-list">
            {savedTrips.map((trip) => (
              <div
                key={trip.itinerary.id}
                className="saved-trip-card"
                onClick={() => onOpenSaved(trip)}
              >
                <div className="saved-trip-info">
                  <strong>{trip.itinerary.tripTitle}</strong>
                  <span>{trip.itinerary.destination}</span>
                  <span className="saved-trip-meta">
                    {trip.itinerary.numDays} day{trip.itinerary.numDays === 1 ? "" : "s"} · saved{" "}
                    {new Date(trip.savedAt).toLocaleDateString()}
                  </span>
                </div>
                <button
                  className="saved-trip-delete"
                  aria-label="Delete saved trip"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteSaved(trip.itinerary.id);
                  }}
                >
                  &times;
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
