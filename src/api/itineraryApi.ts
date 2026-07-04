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

async function postJson<TResponse>(url: string, body: unknown): Promise<TResponse> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Access-Code": getAccessCode() },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) {
    if (res.status === 401) throw new AccessCodeError(data?.error ?? "Access code required.");
    throw new Error(data?.error ?? `Request failed with status ${res.status}`);
  }
  return data as TResponse;
}

export async function checkAccess(): Promise<boolean> {
  const res = await fetch("/api/health", { headers: { "X-Access-Code": getAccessCode() } });
  return res.status !== 401;
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
