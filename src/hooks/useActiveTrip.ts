import { useEffect, useState } from "react";
import type { ChatMessage, Itinerary } from "../types";

const STORAGE_KEY = "holidayPlanner.activeTrip.v1";
const STORAGE_VERSION = 1;

interface StoredActiveTrip {
  itinerary: Itinerary;
  chatHistory: ChatMessage[];
  completedStopIds: string[];
}

function loadInitial(): StoredActiveTrip | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed.version !== STORAGE_VERSION || !parsed.itinerary) return null;
    return {
      itinerary: parsed.itinerary,
      chatHistory: parsed.chatHistory ?? [],
      completedStopIds: Array.isArray(parsed.completedStopIds) ? parsed.completedStopIds : [],
    };
  } catch {
    return null;
  }
}

export function useActiveTrip() {
  const [itinerary, setItinerary] = useState<Itinerary | null>(() => loadInitial()?.itinerary ?? null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>(() => loadInitial()?.chatHistory ?? []);
  const [completedStopIds, setCompletedStopIds] = useState<Set<string>>(
    () => new Set(loadInitial()?.completedStopIds ?? []),
  );

  useEffect(() => {
    if (itinerary) {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          version: STORAGE_VERSION,
          itinerary,
          chatHistory,
          completedStopIds: [...completedStopIds],
        }),
      );
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [itinerary, chatHistory, completedStopIds]);

  function toggleStopDone(stopId: string) {
    setCompletedStopIds((prev) => {
      const next = new Set(prev);
      if (next.has(stopId)) {
        next.delete(stopId);
      } else {
        next.add(stopId);
      }
      return next;
    });
  }

  function startOver() {
    setItinerary(null);
    setChatHistory([]);
    setCompletedStopIds(new Set());
  }

  return {
    itinerary,
    setItinerary,
    chatHistory,
    setChatHistory,
    completedStopIds,
    setCompletedStopIds,
    toggleStopDone,
    startOver,
  };
}
