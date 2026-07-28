import { useEffect, useState } from "react";
import type { ChatMessage, Itinerary, TripBudget } from "../types";

const STORAGE_KEY = "holidayPlanner.activeTrip.v1";
const STORAGE_VERSION = 1;

interface StoredActiveTrip {
  itinerary: Itinerary;
  chatHistory: ChatMessage[];
  completedStopIds: string[];
  checklistDone: string[];
  /** What the user asked the trip to cost, as they typed it. Kept here rather
   *  than on the Itinerary because the itinerary round-trips through the model
   *  on every chat edit, which would drop any field the schema doesn't know. */
  budgetTarget: string | null;
  /** The budget as it stood before the most recent edit, so the Budget screen
   *  can show what that edit did. Cleared by undo. */
  previousBudget: TripBudget | null;
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
      // Added after v1 shipped; older saved trips just won't have this key,
      // which is fine — an empty checklist is the correct starting state.
      checklistDone: Array.isArray(parsed.checklistDone) ? parsed.checklistDone : [],
      // Also later additions. Absent means "no target set" and "nothing to
      // compare against", both of which are the right starting state, so no
      // storage version bump is needed.
      budgetTarget: typeof parsed.budgetTarget === "string" ? parsed.budgetTarget : null,
      previousBudget: parsed.previousBudget ?? null,
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
  const [checklistDone, setChecklistDone] = useState<Set<string>>(
    () => new Set(loadInitial()?.checklistDone ?? []),
  );
  const [budgetTarget, setBudgetTarget] = useState<string | null>(
    () => loadInitial()?.budgetTarget ?? null,
  );
  const [previousBudget, setPreviousBudget] = useState<TripBudget | null>(
    () => loadInitial()?.previousBudget ?? null,
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
          checklistDone: [...checklistDone],
          budgetTarget,
          previousBudget,
        }),
      );
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [itinerary, chatHistory, completedStopIds, checklistDone, budgetTarget, previousBudget]);

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

  function toggleChecklistItem(itemId: string) {
    setChecklistDone((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  }

  function startOver() {
    setItinerary(null);
    setChatHistory([]);
    setCompletedStopIds(new Set());
    setChecklistDone(new Set());
    setBudgetTarget(null);
    setPreviousBudget(null);
  }

  return {
    itinerary,
    setItinerary,
    chatHistory,
    setChatHistory,
    completedStopIds,
    setCompletedStopIds,
    toggleStopDone,
    checklistDone,
    toggleChecklistItem,
    budgetTarget,
    setBudgetTarget,
    previousBudget,
    setPreviousBudget,
    startOver,
  };
}
