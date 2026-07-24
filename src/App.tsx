import { useEffect, useRef, useState } from "react";
import { useActiveTrip } from "./hooks/useActiveTrip";
import { useSavedTrips, type SavedTrip } from "./hooks/useSavedTrips";
import { useAppNav, type Tab } from "./hooks/useAppNav";
import { useSession } from "./hooks/useSession";
import { useAccountPrefs } from "./hooks/useAccountPrefs";
import { checkAccess, generateItinerary, sendChatMessage, type AccessState } from "./api/itineraryApi";
import { setAccessCode } from "./api/accessCode";
import type { ChatMessage, GenerateItineraryRequest, Itinerary } from "./types";
import { HomeScreen } from "./screens/HomeScreen";
import { GenerationScreen } from "./screens/GenerationScreen";
import { ItineraryScreen } from "./screens/ItineraryScreen";
import { TripsScreen } from "./screens/TripsScreen";
import { TabBar } from "./components/TabBar";
import { ErrorBanner } from "./components/ErrorBanner";
import { AccessGate } from "./components/AccessGate";
import { PassportScreen } from "./screens/PassportScreen";
import { AccountScreen } from "./screens/account/AccountScreen";
import { EntryFlow } from "./screens/entry/EntryFlow";
import { cityName } from "./utils/destination";
import "./index.css";

function newChatMessage(role: ChatMessage["role"], content: string): ChatMessage {
  return { id: crypto.randomUUID(), role, content, timestamp: new Date().toISOString() };
}

/**
 * Stops that are new or materially changed between two itinerary versions —
 * drives the coral "UPDATED" tag after a chat edit.
 */
function diffChangedStops(before: Itinerary, after: Itinerary): Set<string> {
  const previous = new Map(
    before.days.flatMap((day) => day.stops.map((stop) => [stop.id, stop] as const)),
  );
  const changed = new Set<string>();
  for (const day of after.days) {
    for (const stop of day.stops) {
      const old = previous.get(stop.id);
      if (
        !old ||
        old.name !== stop.name ||
        old.timeOfDay !== stop.timeOfDay ||
        old.description !== stop.description
      ) {
        changed.add(stop.id);
      }
    }
  }
  return changed;
}

function App() {
  const {
    itinerary,
    setItinerary,
    chatHistory,
    setChatHistory,
    completedStopIds,
    setCompletedStopIds,
    toggleStopDone,
  } = useActiveTrip();
  const savedTrips = useSavedTrips();
  const nav = useAppNav();
  const session = useSession();
  const accountPrefs = useAccountPrefs();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [genError, setGenError] = useState<string | null>(null);
  const [updatedStopIds, setUpdatedStopIds] = useState<Set<string>>(new Set());
  const [undo, setUndo] = useState<{ snapshot: Itinerary; message: string } | null>(null);
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Swipe-to-delete a trip card on the Trips tab (active or finished) —
  // separate from the itinerary-edit undo above since it discards a whole
  // trip, not an edit. Only one can be pending at a time, matching the
  // single undo toast the Trips screen renders.
  const [tripsUndo, setTripsUndo] = useState<
    | { kind: "active"; itinerary: Itinerary; chatHistory: ChatMessage[]; completedStopIds: Set<string> }
    | { kind: "saved"; entry: SavedTrip }
    | null
  >(null);
  const tripsUndoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [access, setAccess] = useState<"checking" | AccessState>("checking");
  const [accessError, setAccessError] = useState<string | null>(null);
  const genRequestRef = useRef(0);
  const lastRequestRef = useRef<GenerateItineraryRequest | null>(null);

  useEffect(() => {
    checkAccess()
      .then(setAccess)
      .catch(() => setAccess("ok"));
  }, []);

  async function handleAccessSubmit(code: string) {
    setAccessCode(code);
    setAccessError(null);
    const result = await checkAccess().catch(() => "ok" as AccessState);
    setAccess(result);
    if (result === "locked") {
      setAccessError("That access code isn't right.");
    }
  }

  if (access !== "ok") {
    return <AccessGate status={access} error={accessError} onSubmit={handleAccessSubmit} />;
  }

  // Simulated entry flow (Splash → Login → Verify → Onboarding). Once the demo
  // session is established it's skipped on subsequent launches. See useSession.
  if (!session.ready) {
    return (
      <div className="app">
        <div className="hp-app-body">
          <EntryFlow onDone={(email) => session.signIn(email)} />
        </div>
      </div>
    );
  }

  async function runGeneration(input: GenerateItineraryRequest) {
    lastRequestRef.current = input;
    const requestId = ++genRequestRef.current;
    setGenError(null);
    setLoading(true);
    try {
      const result = await generateItinerary(input);
      if (genRequestRef.current !== requestId) return; // cancelled / superseded
      setItinerary(result);
      setChatHistory([]);
      setCompletedStopIds(new Set());
      nav.navigate({ name: "itinerary" });
    } catch (err) {
      if (genRequestRef.current !== requestId) return;
      setGenError(err instanceof Error ? err.message : "Something went wrong planning your trip.");
    } finally {
      if (genRequestRef.current === requestId) setLoading(false);
    }
  }

  function handleGenerate(input: GenerateItineraryRequest) {
    nav.navigate({ name: "generation", request: input });
    void runGeneration(input);
  }

  function handleCancelGeneration() {
    genRequestRef.current++; // invalidate in-flight result
    setGenError(null);
    setLoading(false);
    nav.resetTo("home");
  }

  async function handleSendChat(message: string) {
    if (!itinerary) return;
    const userMessage = newChatMessage("user", message);
    setChatHistory((prev) => [...prev, userMessage]);
    setLoading(true);
    setError(null);
    try {
      const result = await sendChatMessage({ itinerary, chatHistory, userMessage: message });
      const changed = diffChangedStops(itinerary, result.itinerary);
      applyItineraryChange(result.itinerary, "Trip updated", [...changed]);
      setChatHistory((prev) => [...prev, newChatMessage("assistant", result.assistantSummary)]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong updating your trip.");
    } finally {
      setLoading(false);
    }
  }

  /**
   * Single entry point for every itinerary edit: records an undo point, marks
   * the touched stops so they render the coral UPDATED note, and shows a toast.
   */
  function applyItineraryChange(next: Itinerary, message: string, changedIds: string[]) {
    if (!itinerary) return;
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    setUndo({ snapshot: itinerary, message });
    setItinerary(next);
    setUpdatedStopIds(new Set(changedIds));
    undoTimerRef.current = setTimeout(() => setUndo(null), 8000);
  }

  function handleUndo() {
    if (!undo) return;
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    setItinerary(undo.snapshot);
    setUpdatedStopIds(new Set());
    setUndo(null);
  }

  // Confirm-screen review: set a stop's visited state explicitly (not a toggle,
  // since Visited/Skipped are distinct buttons).
  function handleToggleStopVisited(stopId: string, visited: boolean) {
    if (completedStopIds.has(stopId) !== visited) toggleStopDone(stopId);
  }

  // Reduce a stay's options down to the single one the user chose (marked
  // "Confirmed"), routed through the undo pipeline like any other edit.
  function handleConfirmAccommodation(accommodationId: string, optionId: string) {
    if (!itinerary) return;
    const acc = itinerary.accommodations?.find((a) => a.id === accommodationId);
    const chosen = acc?.options.find((o) => o.id === optionId);
    if (!chosen) return;
    const next: Itinerary = {
      ...itinerary,
      accommodations: itinerary.accommodations?.map((a) =>
        a.id === accommodationId ? { ...a, options: [{ ...chosen, style: "Confirmed" }] } : a,
      ),
      updatedAt: new Date().toISOString(),
    };
    applyItineraryChange(next, `${chosen.name} confirmed`, []);
  }

  // Asking the planner for stays is just a chat instruction, same as the old flow.
  function handleAddAccommodation() {
    handleSendChat(
      "Please suggest accommodation options for this trip - include 3 distinct options (budget, mid-range, boutique/luxury) covering the whole stay.",
    );
  }

  // Confirm's "Generate my trip passport →": snapshot this trip into saved
  // history (so it shows up under Account → Past trips) before switching tabs.
  function handleShowPassport() {
    if (itinerary) savedTrips.saveTrip(itinerary, chatHistory, [...completedStopIds]);
    nav.resetTo("passport");
  }

  // Manual bookmark toggle on the itinerary header — lets the user save a
  // trip as soon as it's generated, without waiting to confirm/complete it.
  function handleToggleSaveTrip() {
    if (!itinerary) return;
    if (savedTrips.isSaved(itinerary.id)) {
      savedTrips.deleteTrip(itinerary.id);
    } else {
      savedTrips.saveTrip(itinerary, chatHistory, [...completedStopIds]);
    }
  }

  function scheduleTripsUndo(next: NonNullable<typeof tripsUndo>) {
    if (tripsUndoTimerRef.current) clearTimeout(tripsUndoTimerRef.current);
    setTripsUndo(next);
    tripsUndoTimerRef.current = setTimeout(() => setTripsUndo(null), 8000);
  }

  // Swipe-to-delete the active trip card on the Trips tab — snapshots
  // everything so it can be fully restored, mirroring the itinerary-edit
  // undo above but for discarding the whole trip.
  function handleDeleteActiveTrip() {
    if (!itinerary) return;
    scheduleTripsUndo({ kind: "active", itinerary, chatHistory, completedStopIds });
    setItinerary(null);
    setChatHistory([]);
    setCompletedStopIds(new Set());
  }

  // Swipe-to-delete a finished (saved) trip card on the Trips tab.
  function handleDeleteSavedTrip(tripId: string) {
    const entry = savedTrips.savedTrips.find((t) => t.itinerary.id === tripId);
    if (!entry) return;
    scheduleTripsUndo({ kind: "saved", entry });
    savedTrips.deleteTrip(tripId);
  }

  function handleUndoTripsDelete() {
    if (!tripsUndo) return;
    if (tripsUndoTimerRef.current) clearTimeout(tripsUndoTimerRef.current);
    if (tripsUndo.kind === "active") {
      setItinerary(tripsUndo.itinerary);
      setChatHistory(tripsUndo.chatHistory);
      setCompletedStopIds(tripsUndo.completedStopIds);
    } else {
      savedTrips.restoreTrip(tripsUndo.entry);
    }
    setTripsUndo(null);
  }

  function handleTabSelect(tab: Tab) {
    nav.resetTo(tab);
  }

  const screen = nav.current;
  // The itinerary is the Trips tab's detail view — keep the tab bar (with
  // Trips highlighted) so there's always a one-tap way out, rather than
  // trapping the user with no back/close affordance.
  const activeTab: Tab = screen.name === "tab" ? screen.tab : screen.name === "itinerary" ? "trips" : "home";
  const showTabBar = screen.name === "tab" || screen.name === "itinerary";

  function renderScreen() {
    switch (screen.name) {
      case "generation":
        return (
          <GenerationScreen
            destination={screen.request.destination}
            error={genError}
            onCancel={handleCancelGeneration}
            onRetry={() => lastRequestRef.current && runGeneration(lastRequestRef.current)}
          />
        );
      case "itinerary":
        return itinerary ? (
          <ItineraryScreen
            itinerary={itinerary}
            chatHistory={chatHistory}
            chatLoading={loading}
            updatedStopIds={updatedStopIds}
            onSendChat={handleSendChat}
            onItineraryChange={applyItineraryChange}
            undoMessage={undo?.message ?? null}
            onUndo={handleUndo}
            onAddAccommodation={handleAddAccommodation}
            onConfirmAccommodation={handleConfirmAccommodation}
            completedStopIds={completedStopIds}
            onToggleStopVisited={handleToggleStopVisited}
            onShowPassport={handleShowPassport}
            isSaved={savedTrips.isSaved(itinerary.id)}
            onToggleSave={handleToggleSaveTrip}
            currency={accountPrefs.prefs.currency}
            onCurrencyChange={(currency) => accountPrefs.update({ currency })}
          />
        ) : (
          <HomeScreen loading={loading} onSubmit={handleGenerate} />
        );
      case "tab":
        switch (screen.tab) {
          case "home":
            return <HomeScreen loading={loading} onSubmit={handleGenerate} />;
          case "trips":
            return (
              <TripsScreen
                itinerary={itinerary}
                savedTrips={savedTrips.savedTrips}
                onOpenActive={() => nav.navigate({ name: "itinerary" })}
                onDeleteActive={handleDeleteActiveTrip}
                onDeleteSaved={handleDeleteSavedTrip}
                tripUndoMessage={
                  tripsUndo
                    ? `Trip removed — ${cityName(
                        tripsUndo.kind === "active"
                          ? tripsUndo.itinerary.destination
                          : tripsUndo.entry.itinerary.destination,
                      )}`
                    : null
                }
                onUndoDelete={handleUndoTripsDelete}
              />
            );
          case "passport":
            return <PassportScreen itinerary={itinerary} completedStopIds={completedStopIds} />;
          case "account":
            return (
              <AccountScreen
                email={session.email}
                savedTrips={savedTrips.savedTrips}
                prefs={accountPrefs.prefs}
                update={accountPrefs.update}
              />
            );
        }
        break;
      default:
        return <HomeScreen loading={loading} onSubmit={handleGenerate} />;
    }
    return null;
  }

  return (
    <div className="app">
      {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}
      <div className="hp-app-body">{renderScreen()}</div>
      {showTabBar && <TabBar active={activeTab} onSelect={handleTabSelect} />}
    </div>
  );
}

export default App;
