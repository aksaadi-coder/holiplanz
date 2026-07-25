import { useCallback, useState } from "react";
import type { GenerateItineraryRequest } from "../types";

export type Tab = "home" | "trips" | "passport" | "account";

export type ReelFeature = "plan" | "stay" | "personalise" | "explore";

/**
 * Top-level screens as a discriminated union. Tab roots show the TabBar;
 * flow screens cover it. Detail overlays are NOT screens — they are local
 * sheet state owned by the screen that opens them.
 */
export type Screen =
  | { name: "tab"; tab: Tab }
  | { name: "generation"; request: GenerateItineraryRequest }
  | { name: "itinerary"; openConfirm?: boolean }
  | { name: "mapFull" }
  | { name: "hotels" }
  | { name: "budget" }
  | { name: "preferences" }
  | { name: "confirm" }
  | { name: "exportPdf" };

const HOME: Screen = { name: "tab", tab: "home" };

export interface AppNav {
  current: Screen;
  stack: Screen[];
  navigate: (screen: Screen) => void;
  back: () => void;
  /** Clear the stack down to a single tab root. */
  resetTo: (tab: Tab) => void;
  canGoBack: boolean;
}

export function useAppNav(initial: Screen = HOME): AppNav {
  const [stack, setStack] = useState<Screen[]>([initial]);

  const navigate = useCallback((screen: Screen) => {
    setStack((prev) => [...prev, screen]);
  }, []);

  const back = useCallback(() => {
    setStack((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev));
  }, []);

  const resetTo = useCallback((tab: Tab) => {
    setStack([{ name: "tab", tab }]);
  }, []);

  return {
    current: stack[stack.length - 1],
    stack,
    navigate,
    back,
    resetTo,
    canGoBack: stack.length > 1,
  };
}
