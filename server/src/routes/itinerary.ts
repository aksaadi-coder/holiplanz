import { Router } from "express";
import { chatItinerary, generateItinerary, getDestinationInfo, getStopDetails } from "../claude.js";

const router = Router();

const MAX_SHORT_TEXT = 300;
const MAX_LONG_TEXT = 2000;

function isValidString(value: unknown, maxLength: number): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= maxLength;
}

function errorMessage(err: unknown): { status: number; message: string } {
  const anyErr = err as { status?: number };
  if (anyErr?.status === 401) {
    return {
      status: 500,
      message: "Server is not configured with a valid Anthropic API key. Check server/.env.",
    };
  }
  if (anyErr?.status === 429 || anyErr?.status === 529) {
    return { status: 503, message: "Claude is busy right now, please try again in a moment." };
  }
  // Never echo the raw error message back to the client - it may contain internal detail.
  return { status: 500, message: "Something went wrong talking to Claude." };
}

router.post("/generate", async (req, res) => {
  try {
    const { destination, numDays, startDate, preferences, includeAccommodation } = req.body ?? {};
    if (!isValidString(destination, MAX_SHORT_TEXT)) {
      res.status(400).json({ error: "destination is required" });
      return;
    }
    if (preferences !== undefined && !isValidString(preferences, MAX_LONG_TEXT)) {
      res.status(400).json({ error: "preferences is too long" });
      return;
    }
    const itinerary = await generateItinerary({
      destination,
      numDays,
      startDate,
      preferences,
      includeAccommodation,
    });
    res.json(itinerary);
  } catch (err) {
    const { status, message } = errorMessage(err);
    console.error("generate itinerary failed:", err);
    res.status(status).json({ error: message });
  }
});

router.post("/chat", async (req, res) => {
  try {
    const { itinerary, chatHistory, userMessage } = req.body ?? {};
    if (!itinerary || !isValidString(userMessage, MAX_LONG_TEXT)) {
      res.status(400).json({ error: "itinerary and userMessage are required" });
      return;
    }
    const result = await chatItinerary({ itinerary, chatHistory: chatHistory ?? [], userMessage });
    res.json(result);
  } catch (err) {
    const { status, message } = errorMessage(err);
    console.error("chat itinerary failed:", err);
    res.status(status).json({ error: message });
  }
});

router.post("/destination-info", async (req, res) => {
  try {
    const { destination } = req.body ?? {};
    if (!isValidString(destination, MAX_SHORT_TEXT)) {
      res.status(400).json({ error: "destination is required" });
      return;
    }
    const info = await getDestinationInfo(destination);
    res.json(info);
  } catch (err) {
    const { status, message } = errorMessage(err);
    console.error("get destination info failed:", err);
    res.status(status).json({ error: message });
  }
});

router.post("/stop-details", async (req, res) => {
  try {
    const { destination, stopName, category } = req.body ?? {};
    if (!isValidString(destination, MAX_SHORT_TEXT) || !isValidString(stopName, MAX_SHORT_TEXT)) {
      res.status(400).json({ error: "destination and stopName are required" });
      return;
    }
    const details = await getStopDetails({ destination, stopName, category: category ?? "activity" });
    res.json(details);
  } catch (err) {
    const { status, message } = errorMessage(err);
    console.error("get stop details failed:", err);
    res.status(status).json({ error: message });
  }
});

export default router;
