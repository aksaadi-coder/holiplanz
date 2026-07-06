import type { Day, Itinerary, Stop } from "../types";

// Local, no-API itinerary edits (swipe-to-delete, drag-to-reorder, move across days).
// Time-of-day rules: labels are treated as belonging to a day's positions, so
// reordering within a day keeps the day's time structure; a stop moved to another
// day adopts the label of the stop it lands after.

function touch(itinerary: Itinerary): Itinerary {
  return { ...itinerary, updatedAt: new Date().toISOString() };
}

export function findStop(
  itinerary: Itinerary,
  stopId: string,
): { day: Day; index: number; stop: Stop } | null {
  for (const day of itinerary.days) {
    const index = day.stops.findIndex((s) => s.id === stopId);
    if (index !== -1) return { day, index, stop: day.stops[index] };
  }
  return null;
}

export function deleteStop(
  itinerary: Itinerary,
  stopId: string,
): { itinerary: Itinerary; removed: Stop; dayNumber: number } | null {
  const found = findStop(itinerary, stopId);
  if (!found) return null;
  const next = touch({
    ...itinerary,
    days: itinerary.days.map((day) =>
      day.dayNumber === found.day.dayNumber
        ? { ...day, stops: day.stops.filter((s) => s.id !== stopId) }
        : day,
    ),
  });
  return { itinerary: next, removed: found.stop, dayNumber: found.day.dayNumber };
}

export function reorderStopWithinDay(
  itinerary: Itinerary,
  dayNumber: number,
  fromIndex: number,
  toIndex: number,
): Itinerary {
  if (fromIndex === toIndex) return itinerary;
  return touch({
    ...itinerary,
    days: itinerary.days.map((day) => {
      if (day.dayNumber !== dayNumber) return day;
      const labels = day.stops.map((s) => s.timeOfDay);
      const stops = [...day.stops];
      const [moved] = stops.splice(fromIndex, 1);
      stops.splice(toIndex, 0, moved);
      return { ...day, stops: stops.map((s, i) => ({ ...s, timeOfDay: labels[i] })) };
    }),
  });
}

export function moveStopToDay(itinerary: Itinerary, stopId: string, targetDayNumber: number): Itinerary {
  const found = findStop(itinerary, stopId);
  if (!found || found.day.dayNumber === targetDayNumber) return itinerary;
  const target = itinerary.days.find((d) => d.dayNumber === targetDayNumber);
  if (!target) return itinerary;
  const lastLabel = target.stops[target.stops.length - 1]?.timeOfDay;
  const moved = { ...found.stop, timeOfDay: lastLabel ?? found.stop.timeOfDay };
  return touch({
    ...itinerary,
    days: itinerary.days.map((day) => {
      if (day.dayNumber === found.day.dayNumber) {
        return { ...day, stops: day.stops.filter((s) => s.id !== stopId) };
      }
      if (day.dayNumber === targetDayNumber) {
        return { ...day, stops: [...day.stops, moved] };
      }
      return day;
    }),
  });
}
