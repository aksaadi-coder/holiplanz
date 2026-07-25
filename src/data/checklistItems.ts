export interface ChecklistItem {
  id: string;
  label: string;
  category: string;
}

/** Static "before you go" prep list — same for every trip. No per-destination
 *  enrichment (e.g. actual plug type) to avoid an extra API call just for
 *  this; Trip info already covers that detail. */
export const CHECKLIST_ITEMS: ChecklistItem[] = [
  { id: "passport", label: "Passport/ID valid for this trip", category: "Documents" },
  { id: "visa", label: "Visa or entry requirements checked", category: "Documents" },
  { id: "insurance", label: "Travel insurance sorted", category: "Documents" },
  { id: "boarding", label: "Boarding passes / booking confirmations saved", category: "Documents" },
  { id: "bank", label: "Bank notified of travel dates", category: "Money & connectivity" },
  { id: "cash", label: "Local currency or cash on hand", category: "Money & connectivity" },
  { id: "sim", label: "SIM / eSIM / roaming plan sorted", category: "Money & connectivity" },
  { id: "maps", label: "Offline maps downloaded", category: "Money & connectivity" },
  { id: "adapter", label: "Power adapter packed", category: "Packing & logistics" },
  { id: "chargers", label: "Chargers / power bank packed", category: "Packing & logistics" },
  { id: "accommodation", label: "Accommodation booking confirmed", category: "Packing & logistics" },
  { id: "shared", label: "Someone at home has a copy of the itinerary", category: "Packing & logistics" },
];
