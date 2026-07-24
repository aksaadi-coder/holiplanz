import { z } from "zod";

const stopCategoryValues = [
  "landmark",
  "museum",
  "food",
  "nature",
  "shopping",
  "nightlife",
  "activity",
  "transport",
  "accommodation",
  "other",
] as const;

const timeOfDayValues = ["morning", "midday", "afternoon", "evening", "night"] as const;

// The model is told to use these enums (they stay in the JSON schema), but it
// occasionally returns a near-miss like "late morning" or "lunchtime". Rather
// than rejecting the whole itinerary, `z.preprocess` maps a stray value to the
// closest valid bucket before the enum check. We use preprocess (not a dynamic
// `.catch`, which can't be serialized to JSON Schema by zodOutputFormat).
// Order matters: "afternoon" contains "noon", so check it before the midday rule.
function coerceTimeOfDay(raw: unknown): unknown {
  if (timeOfDayValues.includes(raw as (typeof timeOfDayValues)[number])) return raw;
  const s = String(raw ?? "").toLowerCase();
  if (/morning|dawn|sunrise|breakfast/.test(s)) return "morning";
  if (/afternoon|tea/.test(s)) return "afternoon";
  if (/noon|midday|mid-day|lunch/.test(s)) return "midday";
  if (/evening|dusk|sunset|dinner/.test(s)) return "evening";
  if (/night|midnight|overnight/.test(s)) return "night";
  return "afternoon";
}

function coerceCategory(raw: unknown): unknown {
  return stopCategoryValues.includes(raw as (typeof stopCategoryValues)[number]) ? raw : "other";
}

export const stopSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  category: z.preprocess(coerceCategory, z.enum(stopCategoryValues)),
  timeOfDay: z.preprocess(coerceTimeOfDay, z.enum(timeOfDayValues)),
  durationMinutes: z.number().optional(),
  lat: z.number(),
  lng: z.number(),
  howToGetThere: z.string().optional(),
});

export const daySchema = z.object({
  dayNumber: z.number().int(),
  date: z.string().optional(),
  title: z.string(),
  summary: z.string(),
  stops: z.array(stopSchema),
});

export const accommodationOptionSchema = z.object({
  id: z.string(),
  name: z.string(),
  area: z.string(),
  style: z.string(),
  description: z.string(),
  lat: z.number(),
  lng: z.number(),
  estimatedPricePerNight: z.string(),
  rating: z.string().optional(),
  walkToStation: z.string().optional(),
});

export const accommodationSchema = z.object({
  id: z.string(),
  startDay: z.number().int(),
  endDay: z.number().int(),
  options: z.array(accommodationOptionSchema).min(1).max(3),
});

export const budgetLineSchema = z.object({
  label: z.string(),
  amount: z.string(),
  share: z.number().min(0).max(100),
});

export const budgetSchema = z.object({
  total: z.string(),
  summary: z.string(),
  lines: z.array(budgetLineSchema).min(2).max(6),
  note: z.string().optional(),
});

export const itineraryCoreSchema = z.object({
  destination: z.string(),
  tripTitle: z.string(),
  startDate: z.string().optional(),
  numDays: z.number().int(),
  preferences: z.string().optional(),
  destinationCenter: z.object({ lat: z.number(), lng: z.number() }),
  days: z.array(daySchema).min(1),
  accommodations: z.array(accommodationSchema).optional(),
  budget: budgetSchema.optional(),
});

export const generateItineraryOutputSchema = itineraryCoreSchema;

export const chatItineraryOutputSchema = z.object({
  itinerary: itineraryCoreSchema,
  assistantSummary: z.string(),
});

export type ItineraryCore = z.infer<typeof itineraryCoreSchema>;
export type ChatItineraryOutput = z.infer<typeof chatItineraryOutputSchema>;

export const destinationInfoOutputSchema = z.object({
  timezone: z.string(),
  currency: z.string(),
  language: z.string(),
  plugType: z.string(),
  tips: z.array(z.string()).min(3).max(6),
});

export type DestinationInfoOutput = z.infer<typeof destinationInfoOutputSchema>;

export const stopDetailsOutputSchema = z.object({
  overview: z.string(),
  highlights: z.array(z.string()).min(2).max(5),
  tips: z.array(z.string()).min(2).max(5),
  estimatedCost: z.string(),
});

export type StopDetailsOutput = z.infer<typeof stopDetailsOutputSchema>;
