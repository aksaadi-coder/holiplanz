import Anthropic, { AnthropicError, APIError } from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { randomUUID } from "node:crypto";
import type { ChatMessage, Itinerary } from "../../shared/types.js";
import { SYSTEM_PROMPT } from "./prompts/systemPrompt.js";
import {
  chatItineraryOutputSchema,
  destinationInfoOutputSchema,
  generateItineraryOutputSchema,
  stopDetailsOutputSchema,
  type DestinationInfoOutput,
  type ItineraryCore,
  type StopDetailsOutput,
} from "./schema/itinerarySchema.js";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const MODEL = "claude-sonnet-5";
// Full-itinerary responses scale with trip length (every stop needs a name,
// description, category, time, duration, and lat/lng, plus a budget
// breakdown and — if requested — accommodation options), so this needs more
// headroom than the small single-field calls below. 16,000 comfortably
// covers even a 14+ day trip with accommodations while staying under the
// ~16K threshold where the SDK recommends streaming.
const ITINERARY_MAX_TOKENS = 16000;

/** The model's response was cut off before it finished the itinerary JSON —
 *  distinguishable from a generic API/parse failure so the route can return
 *  an actionable message instead of a generic "something went wrong". */
export class ItineraryTooLargeError extends Error {
  constructor() {
    super("Itinerary response exceeded the output token limit before completing");
    this.name = "ItineraryTooLargeError";
  }
}

/** client.messages.parse() throws a plain AnthropicError (no .status) when
 *  the response text fails JSON.parse or schema validation — which is
 *  exactly what happens when max_tokens cuts the response off mid-JSON.
 *  Real API errors (auth, rate limit, etc.) are APIError subclasses and
 *  pass through unchanged. */
function rethrowAsTooLargeIfTruncated(err: unknown): never {
  if (err instanceof AnthropicError && !(err instanceof APIError)) {
    throw new ItineraryTooLargeError();
  }
  throw err;
}

function toItinerary(core: ItineraryCore, existing?: Itinerary): Itinerary {
  const now = new Date().toISOString();
  return {
    ...core,
    id: existing?.id ?? randomUUID(),
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
}

export async function generateItinerary(input: {
  destination: string;
  numDays?: number;
  startDate?: string;
  preferences?: string;
  includeAccommodation?: boolean;
}): Promise<Itinerary> {
  const userMessage = [
    `Plan a trip to ${input.destination}.`,
    input.numDays
      ? `Trip length: ${input.numDays} days.`
      : `Use your judgement for a sensible trip length if not specified (default to 3-5 days).`,
    input.startDate ? `Start date: ${input.startDate}.` : "",
    input.preferences ? `Preferences: ${input.preferences}.` : "",
    input.includeAccommodation
      ? `Also suggest accommodation: include an "accommodations" array covering the full trip, with 3 distinct options (budget, mid-range, boutique/luxury) per city/area.`
      : "",
  ]
    .filter(Boolean)
    .join(" ");

  const message = await client.messages
    .parse({
      model: MODEL,
      max_tokens: ITINERARY_MAX_TOKENS,
      system: SYSTEM_PROMPT,
      output_config: { format: zodOutputFormat(generateItineraryOutputSchema) },
      messages: [{ role: "user", content: userMessage }],
    })
    .catch(rethrowAsTooLargeIfTruncated);

  if (!message.parsed_output) {
    throw new Error("Claude did not return a parseable itinerary");
  }

  return toItinerary(message.parsed_output);
}

export async function chatItinerary(input: {
  itinerary: Itinerary;
  chatHistory: ChatMessage[];
  userMessage: string;
}): Promise<{ itinerary: Itinerary; assistantSummary: string }> {
  const historyMessages: Anthropic.MessageParam[] = input.chatHistory.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  const currentStateMessage = `Here is the current itinerary (JSON):\n${JSON.stringify(
    input.itinerary,
  )}\n\nThe user's request: "${input.userMessage}"\n\nReturn the complete updated itinerary incorporating this request, along with a one-sentence human-readable summary of what you changed.`;

  const message = await client.messages
    .parse({
      model: MODEL,
      max_tokens: ITINERARY_MAX_TOKENS,
      system: SYSTEM_PROMPT,
      output_config: { format: zodOutputFormat(chatItineraryOutputSchema) },
      messages: [...historyMessages, { role: "user", content: currentStateMessage }],
    })
    .catch(rethrowAsTooLargeIfTruncated);

  if (!message.parsed_output) {
    throw new Error("Claude did not return a parseable itinerary");
  }

  return {
    itinerary: toItinerary(message.parsed_output.itinerary, input.itinerary),
    assistantSummary: message.parsed_output.assistantSummary,
  };
}

const DESTINATION_INFO_PROMPT = `You are a travel-facts assistant. Given a destination, return practical, factual traveler information: its IANA timezone identifier (e.g. "Europe/Prague"), the primary local currency (name and code), the primary local language(s), the electrical plug/socket type(s) and voltage used, and 3-5 short "good to know" tips (e.g. tipping customs, safety notes, common scams to avoid, cultural etiquette). Do not state specific visa or entry requirements as fact - if relevant, instead include a tip advising the traveler to check current visa/entry requirements for their nationality with an official source before departure, since these rules vary by nationality and change often.`;

export async function getDestinationInfo(destination: string): Promise<DestinationInfoOutput> {
  const message = await client.messages.parse({
    model: MODEL,
    max_tokens: 1024,
    system: DESTINATION_INFO_PROMPT,
    output_config: { format: zodOutputFormat(destinationInfoOutputSchema) },
    messages: [{ role: "user", content: `Destination: ${destination}` }],
  });

  if (!message.parsed_output) {
    throw new Error("Claude did not return parseable destination info");
  }

  return message.parsed_output;
}

const STOP_DETAILS_PROMPT = `You are a knowledgeable local travel guide. Given a specific place someone plans to visit, write rich, engaging detail about it: a 2-4 sentence overview covering its history/significance/what it actually is, 2-4 specific highlights (things to see, do, or notice while there), and 2-4 practical visiting tips (best time of day to go, how long to spend, how to avoid crowds, booking advice, etc.). Also give a rough estimated cost for a typical visitor (e.g. "Free", "€15-20 per person", "$$ - moderate"). Prices, hours, and booking rules change often, so phrase cost/tips as approximate guidance and suggest checking current official details before visiting rather than stating them as fixed facts.`;

export async function getStopDetails(input: {
  destination: string;
  stopName: string;
  category: string;
}): Promise<StopDetailsOutput> {
  const message = await client.messages.parse({
    model: MODEL,
    max_tokens: 1024,
    system: STOP_DETAILS_PROMPT,
    output_config: { format: zodOutputFormat(stopDetailsOutputSchema) },
    messages: [
      {
        role: "user",
        content: `Place: ${input.stopName} (${input.category}), in ${input.destination}.`,
      },
    ],
  });

  if (!message.parsed_output) {
    throw new Error("Claude did not return parseable stop details");
  }

  return message.parsed_output;
}
