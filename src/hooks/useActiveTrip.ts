import { useEffect, useState } from "react";
import type { ChatMessage, Itinerary } from "../types";

const STORAGE_KEY = "holidayPlanner.activeTrip.v1";
const STORAGE_VERSION = 1;

interface StoredActiveTrip {
  itinerary: Itinerary;
  chatHistory: ChatMessage[];
}

function loadInitial(): StoredActiveTrip | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed.version !== STORAGE_VERSION || !parsed.itinerary) return null;
    return { itinerary: parsed.itinerary, chatHistory: parsed.chatHistory ?? [] };
  } catch {
    return null;
  }
}

export function useActiveTrip() {
  const [itinerary, setItinerary] = useState<Itinerary | null>(() => loadInitial()?.itinerary ?? null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>(() => loadInitial()?.chatHistory ?? []);

  useEffect(() => {
    if (itinerary) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: STORAGE_VERSION, itinerary, chatHistory }));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [itinerary, chatHistory]);

  function startOver() {
    setItinerary(null);
    setChatHistory([]);
  }

  return { itinerary, setItinerary, chatHistory, setChatHistory, startOver };
}
