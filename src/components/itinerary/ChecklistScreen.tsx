import { Toggle } from "../ui/primitives";
import { CHECKLIST_ITEMS } from "../../data/checklistItems";

interface Props {
  open: boolean;
  checklistDone: Set<string>;
  onToggle: (itemId: string) => void;
  onClose: () => void;
  /** Label for the back link — differs by entry point (Itinerary row vs. Trips tab). */
  backLabel?: string;
}

const CATEGORIES = [...new Set(CHECKLIST_ITEMS.map((item) => item.category))];

/** Full-screen "Before you go" prep checklist. Plain per-item toggles,
 *  grouped by category; state persists with the trip (see useActiveTrip). */
export function ChecklistScreen({ open, checklistDone, onToggle, onClose, backLabel = "‹ Itinerary" }: Props) {
  if (!open) return null;

  const total = CHECKLIST_ITEMS.length;
  const done = CHECKLIST_ITEMS.filter((item) => checklistDone.has(item.id)).length;

  return (
    <div className="hp-fullscreen hp-checklist">
      <div className="hp-checklist-scroll">
        <button type="button" className="hp-back-link" onClick={onClose}>
          {backLabel}
        </button>
        <h1>Before you go</h1>
        <p className="hp-label hp-checklist-progress">
          {done} of {total} ready
        </p>

        {CATEGORIES.map((category) => (
          <div key={category}>
            <p className="hp-label hp-checklist-cat">{category}</p>
            {CHECKLIST_ITEMS.filter((item) => item.category === category).map((item) => {
              const checked = checklistDone.has(item.id);
              return (
                <div className="hp-prefs-row" key={item.id}>
                  <span className={checked ? "hp-checklist-label-done" : ""}>{item.label}</span>
                  <Toggle checked={checked} onChange={() => onToggle(item.id)} label={item.label} />
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
