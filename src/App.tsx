import { useEffect, useState } from "react";
import { useActiveTrip } from "./hooks/useActiveTrip";
import { useSavedTrips, type SavedTrip } from "./hooks/useSavedTrips";
import { checkAccess, generateItinerary, sendChatMessage, type AccessState } from "./api/itineraryApi";
import { setAccessCode } from "./api/accessCode";
import type { ChatMessage, GenerateItineraryRequest } from "./types";
import { TripSetupForm } from "./components/TripSetupForm";
import { TripView } from "./components/TripView";
import { ErrorBanner } from "./components/ErrorBanner";
import { AccessGate } from "./components/AccessGate";
import "./index.css";

function newChatMessage(role: ChatMessage["role"], content: string): ChatMessage {
  return { id: crypto.randomUUID(), role, content, timestamp: new Date().toISOString() };
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
    startOver,
  } = useActiveTrip();
  const { savedTrips, saveTrip, deleteTrip, isSaved } = useSavedTrips();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [access, setAccess] = useState<"checking" | AccessState>("checking");
  const [accessError, setAccessError] = useState<string | null>(null);

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
    return (
      <AccessGate
        status={access}
        error={accessError}
        onSubmit={handleAccessSubmit}
      />
    );
  }

  async function handleGenerate(input: GenerateItineraryRequest) {
    setLoading(true);
    setError(null);
    try {
      const result = await generateItinerary(input);
      setItinerary(result);
      setChatHistory([]);
      setCompletedStopIds(new Set());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong planning your trip.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSendChat(message: string) {
    if (!itinerary) return;
    const userMessage = newChatMessage("user", message);
    setChatHistory((prev) => [...prev, userMessage]);
    setLoading(true);
    setError(null);
    try {
      const result = await sendChatMessage({ itinerary, chatHistory, userMessage: message });
      setItinerary(result.itinerary);
      setChatHistory((prev) => [...prev, newChatMessage("assistant", result.assistantSummary)]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong updating your trip.");
    } finally {
      setLoading(false);
    }
  }

  function handleConfirmAccommodationOption(accommodationId: string, optionId: string) {
    if (!itinerary) return;
    setItinerary({
      ...itinerary,
      accommodations: itinerary.accommodations?.map((acc) =>
        acc.id === accommodationId
          ? {
              ...acc,
              options: acc.options
                .filter((option) => option.id === optionId)
                .map((option) => ({ ...option, style: "Confirmed" })),
            }
          : acc,
      ),
      updatedAt: new Date().toISOString(),
    });
  }

  function handleToggleSave() {
    if (!itinerary) return;
    if (isSaved(itinerary.id)) {
      deleteTrip(itinerary.id);
    } else {
      saveTrip(itinerary, chatHistory, [...completedStopIds]);
    }
  }

  function handleOpenSaved(trip: SavedTrip) {
    setItinerary(trip.itinerary);
    setChatHistory(trip.chatHistory);
    setCompletedStopIds(new Set(trip.completedStopIds ?? []));
  }

  return (
    <div className="app">
      {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}
      {itinerary ? (
        <TripView
          itinerary={itinerary}
          chatHistory={chatHistory}
          chatLoading={loading}
          saved={isSaved(itinerary.id)}
          onStartOver={startOver}
          onSendChat={handleSendChat}
          onToggleSave={handleToggleSave}
          onConfirmAccommodationOption={handleConfirmAccommodationOption}
          onUpdateItinerary={setItinerary}
          completedStopIds={completedStopIds}
          onToggleStopDone={toggleStopDone}
        />
      ) : (
        <TripSetupForm
          loading={loading}
          error={null}
          savedTrips={savedTrips}
          onSubmit={handleGenerate}
          onOpenSaved={handleOpenSaved}
          onDeleteSaved={deleteTrip}
        />
      )}
    </div>
  );
}

export default App;
