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

export const stopSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  category: z.enum(stopCategoryValues),
  timeOfDay: z.enum(timeOfDayValues),
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
});

export const accommodationSchema = z.object({
  id: z.string(),
  startDay: z.number().int(),
  endDay: z.number().int(),
  options: z.array(accommodationOptionSchema).min(1).max(3),
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
