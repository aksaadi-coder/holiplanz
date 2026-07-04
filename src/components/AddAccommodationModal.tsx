import { useState } from "react";
import type { FormEvent } from "react";

export interface AddAccommodationInput {
  includeAccommodation?: boolean;
  bookedAccommodation?: string;
}

interface Props {
  loading: boolean;
  onSubmit: (input: AddAccommodationInput) => void;
  onClose: () => void;
}

export function AddAccommodationModal({ loading, onSubmit, onClose }: Props) {
  const [mode, setMode] = useState<"suggest" | "booked">("suggest");
  const [bookedAccommodation, setBookedAccommodation] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (mode === "booked" && !bookedAccommodation.trim()) return;
    onSubmit(mode === "suggest" ? { includeAccommodation: true } : { bookedAccommodation: bookedAccommodation.trim() });
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close">
          &times;
        </button>
        <h3>Add accommodation</h3>
        <form className="add-accommodation-form" onSubmit={handleSubmit}>
          <label className="checkbox-row">
            <input
              type="radio"
              name="accommodation-mode"
              checked={mode === "suggest"}
              onChange={() => setMode("suggest")}
              disabled={loading}
            />
            Suggest a few options for me
          </label>
          <label className="checkbox-row">
            <input
              type="radio"
              name="accommodation-mode"
              checked={mode === "booked"}
              onChange={() => setMode("booked")}
              disabled={loading}
            />
            I already booked a place
          </label>
          {mode === "booked" && (
            <input
              type="text"
              placeholder="e.g. Hotel Alfonso XIII"
              value={bookedAccommodation}
              onChange={(e) => setBookedAccommodation(e.target.value)}
              disabled={loading}
              autoFocus
            />
          )}
          <button type="submit" disabled={loading || (mode === "booked" && !bookedAccommodation.trim())}>
            {loading ? "Updating your trip..." : "Add accommodation"}
          </button>
        </form>
      </div>
    </div>
  );
}
