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
  howToGetThere?: string;
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
  /** e.g. "4.5 / 5" — shown on the hotel detail. */
  rating?: string;
  /** e.g. "6 min" walk to the nearest station. */
  walkToStation?: string;
}

export interface Accommodation {
  id: string;
  startDay: number;
  endDay: number;
  options: AccommodationOption[];
}

export interface BudgetLine {
  /** e.g. "Accommodation", "Food & drink" */
  label: string;
  /** Local-currency figure, e.g. "¥168,000" */
  amount: string;
  /** Percentage of the total, 0-100 — drives the bar width. */
  share: number;
}

export interface TripBudget {
  /** Headline figure in local currency, e.g. "¥412,000" */
  total: string;
  /** e.g. "for 2 adults · 7 days · ≈ €2,430" */
  summary: string;
  lines: BudgetLine[];
  /** Caveat shown under the breakdown. */
  note?: string;
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
  /** Rough all-in cost breakdown for the trip — powers the Budget screen. */
  budget?: TripBudget;
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
