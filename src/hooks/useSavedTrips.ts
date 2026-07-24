import { useEffect, useState } from "react";
import type { ChatMessage, Itinerary } from "../types";

const STORAGE_KEY = "holidayPlanner.savedTrips.v1";
const STORAGE_VERSION = 1;

export interface SavedTrip {
  itinerary: Itinerary;
  chatHistory: ChatMessage[];
  savedAt: string;
  completedStopIds?: string[];
}

function loadInitial(): SavedTrip[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (parsed.version !== STORAGE_VERSION || !Array.isArray(parsed.trips)) return [];
    return parsed.trips;
  } catch {
    return [];
  }
}

export function useSavedTrips() {
  const [savedTrips, setSavedTrips] = useState<SavedTrip[]>(loadInitial);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: STORAGE_VERSION, trips: savedTrips }));
  }, [savedTrips]);

  function saveTrip(itinerary: Itinerary, chatHistory: ChatMessage[], completedStopIds?: string[]) {
    setSavedTrips((prev) => {
      const entry: SavedTrip = {
        itinerary,
        chatHistory,
        savedAt: new Date().toISOString(),
        completedStopIds,
      };
      const existingIndex = prev.findIndex((t) => t.itinerary.id === itinerary.id);
      if (existingIndex >= 0) {
        const copy = [...prev];
        copy[existingIndex] = entry;
        return copy;
      }
      return [entry, ...prev];
    });
  }

  function deleteTrip(itineraryId: string) {
    setSavedTrips((prev) => prev.filter((t) => t.itinerary.id !== itineraryId));
  }

  /** Re-insert a previously-deleted entry as-is (savedAt and all) — for
   *  undoing a swipe-to-delete, as opposed to `saveTrip`'s fresh timestamp. */
  function restoreTrip(entry: SavedTrip) {
    setSavedTrips((prev) =>
      prev.some((t) => t.itinerary.id === entry.itinerary.id) ? prev : [entry, ...prev],
    );
  }

  function isSaved(itineraryId: string) {
    return savedTrips.some((t) => t.itinerary.id === itineraryId);
  }

  return { savedTrips, saveTrip, deleteTrip, restoreTrip, isSaved };
}
