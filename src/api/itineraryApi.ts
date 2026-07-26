import type {
  ChatItineraryRequest,
  ChatItineraryResponse,
  DestinationInfo,
  GenerateItineraryRequest,
  Itinerary,
  StopDetails,
} from "../types";
import { getAccessCode } from "./accessCode";

export class AccessCodeError extends Error {}

/**
 * Message for a failure that did NOT come from our own Express app — those
 * always answer with a JSON `{ error }` we can show directly. These come from
 * the hosting platform in front of it, and their bodies are plain text or HTML.
 *
 * 504 is the one that actually happens: the itinerary call is slow (a 10-day
 * trip measured ~1m45s), so it used to run past the deployed function's
 * duration limit, and Vercel answered with its plain-text "An error occurred
 * with your deployment" page. The limit is raised in vercel.json now, but the
 * message stays — a timeout is always possible on a long enough trip, and it
 * needs to say something actionable.
 */
function statusMessage(status: number): string {
  if (status === 408 || status === 504) {
    return "That took too long and timed out. Longer trips take more planning — try again, or plan a few days fewer.";
  }
  if (status === 502 || status === 503) {
    return "The server isn't reachable right now. Please try again in a moment.";
  }
  return `Something went wrong (error ${status}). Please try again.`;
}

async function postJson<TResponse>(url: string, body: unknown): Promise<TResponse> {
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Access-Code": getAccessCode() },
      body: JSON.stringify(body),
    });
  } catch {
    // fetch only rejects on a transport failure — offline, DNS, or a connection
    // dropped mid-flight, which a long generation on a mobile network invites.
    throw new Error("Couldn't reach the server. Check your connection and try again.");
  }

  // Read as text, not res.json(): a non-JSON error body (see statusMessage)
  // made res.json() throw its own SyntaxError, and that raw parser message
  // — 'Unexpected token "A"… is not valid JSON' — was what the user ended up
  // reading on the loading screen.
  const text = await res.text();
  let data: { error?: string } | null = null;
  try {
    data = text ? (JSON.parse(text) as { error?: string }) : null;
  } catch {
    data = null;
  }

  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      throw new AccessCodeError(data?.error ?? "Access code required.");
    }
    throw new Error(data?.error ?? statusMessage(res.status));
  }
  if (data === null) {
    throw new Error("The server's reply couldn't be read. Please try again.");
  }
  return data as TResponse;
}

export type AccessState = "ok" | "locked" | "expired";

export async function checkAccess(): Promise<AccessState> {
  const res = await fetch("/api/health", { headers: { "X-Access-Code": getAccessCode() } });
  if (res.status === 403) return "expired";
  if (res.status === 401) return "locked";
  return "ok";
}

export function generateItinerary(input: GenerateItineraryRequest): Promise<Itinerary> {
  return postJson<Itinerary>("/api/itinerary/generate", input);
}

export function sendChatMessage(input: ChatItineraryRequest): Promise<ChatItineraryResponse> {
  return postJson<ChatItineraryResponse>("/api/itinerary/chat", input);
}

export function fetchDestinationInfo(destination: string): Promise<DestinationInfo> {
  return postJson<DestinationInfo>("/api/itinerary/destination-info", { destination });
}

export function fetchStopDetails(destination: string, stopName: string, category: string): Promise<StopDetails> {
  return postJson<StopDetails>("/api/itinerary/stop-details", { destination, stopName, category });
}
