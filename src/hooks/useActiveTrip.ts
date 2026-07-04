import { useState } from "react";
import type { ChatMessage, Itinerary } from "../types";

export function useActiveTrip() {
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);

  function startOver() {
    setItinerary(null);
    setChatHistory([]);
  }

  return { itinerary, setItinerary, chatHistory, setChatHistory, startOver };
}
