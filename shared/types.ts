export type StopCategory =
  | "landmark"
  | "museum"
  | "food"
  | "nature"
  | "shopping"
  | "nightlife"
  | "activity"
  | "transport"
  | "accommodation"
  | "other";

export type TimeOfDay = "morning" | "midday" | "afternoon" | "evening" | "night";

export interface Stop {
  id: string;
  name: string;
  description: string;
  category: StopCategory;
  timeOfDay: TimeOfDay;
  durationMinutes?: number;
  lat: number;
  lng: number;
}

export interface Day {
  dayNumber: number;
  date?: string;
  title: string;
  summary: string;
  stops: Stop[];
}

export interface AccommodationOption {
  id: string;
  name: string;
  area: string;
  style: string;
  description: string;
  lat: number;
  lng: number;
  estimatedPricePerNight: string;
}

export interface Accommodation {
  id: string;
  startDay: number;
  endDay: number;
  options: AccommodationOption[];
}

export interface Itinerary {
  id: string;
  destination: string;
  tripTitle: string;
  startDate?: string;
  numDays: number;
  preferences?: string;
  destinationCenter: { lat: number; lng: number };
  days: Day[];
  accommodations?: Accommodation[];
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface GenerateItineraryRequest {
  destination: string;
  numDays?: number;
  startDate?: string;
  preferences?: string;
  includeAccommodation?: boolean;
  bookedAccommodation?: string;
}

export interface ChatItineraryRequest {
  itinerary: Itinerary;
  chatHistory: ChatMessage[];
  userMessage: string;
}

export interface ChatItineraryResponse {
  itinerary: Itinerary;
  assistantSummary: string;
}

export interface DestinationInfo {
  timezone: string;
  currency: string;
  language: string;
  plugType: string;
  tips: string[];
}

export interface StopDetails {
  overview: string;
  highlights: string[];
  tips: string[];
  estimatedCost: string;
}
