import { useEffect, useState } from "react";
import { RELAXED_DAY2_STOP, SAMPLE_TRIP } from "../../data/sampleTrip";

const USER_MESSAGE = "Make day 2 more relaxed";
const ASSISTANT_MESSAGE =
  "Done! I swapped the museum visit for a slow riverside afternoon, so day 2 now winds down gently after the pastéis.";
const TYPE_MS = 45;

// Act 1: chat tailoring (typed message -> assistant answer -> stop swap).
// Act 2: a ghost finger acts out the hands-on gestures on the same list:
// drag to reorder, swipe left to delete, tap a number to check off.
const PHASES = [
  "typing",
  "thinking",
  "answered",
  "dragPress",
  "dragMove",
  "dragDone",
  "swipe",
  "swipeGone",
  "check",
  "closing",
] as const;
type Phase = (typeof PHASES)[number];

const ACT2_CAPTIONS: Partial<Record<Phase, string>> = {
  dragPress: "Hold & drag to reorder",
  dragMove: "Hold & drag to reorder",
  dragDone: "Hold & drag to reorder",
  swipe: "Swipe left to delete",
  swipeGone: "Swipe left to delete",
  check: "Tap a number to check off",
  closing: "Chat when you want ideas. Touch when you know what you want.",
};

// Offsets (ms) added to the end of the typing animation.
const SCHEDULE: [Phase, number][] = [
  ["thinking", 400],
  ["answered", 2000],
  ["dragPress", 3900],
  ["dragMove", 4500],
  ["dragDone", 5300],
  ["swipe", 6200],
  ["swipeGone", 7200],
  ["check", 8000],
  ["closing", 9200],
];

export function SpotlightChat() {
  const [runId, setRunId] = useState(0);
  const [typedChars, setTypedChars] = useState(0);
  const [phase, setPhase] = useState<Phase>("typing");

  useEffect(() => {
    setTypedChars(0);
    setPhase("typing");
    const interval = setInterval(() => {
      setTypedChars((c) => {
        if (c >= USER_MESSAGE.length) {
          clearInterval(interval);
          return c;
        }
        return c + 1;
      });
    }, TYPE_MS);
    const typeDuration = USER_MESSAGE.length * TYPE_MS;
    const timers = SCHEDULE.map(([p, offset]) => setTimeout(() => setPhase(p), typeDuration + offset));
    return () => {
      clearInterval(interval);
      timers.forEach(clearTimeout);
    };
  }, [runId]);

  const reached = (p: Phase) => PHASES.indexOf(phase) >= PHASES.indexOf(p);

  const day2 = SAMPLE_TRIP.days.find((d) => d.dayNumber === 2)!;
  let stops = day2.stops.map((s) => (s.name === "MAAT" && reached("answered") ? RELAXED_DAY2_STOP : s));
  // Drag result: Pastéis (index 2) moves up one, swapping with Jerónimos (index 1).
  if (reached("dragDone")) {
    stops = [stops[0], stops[2], stops[1], ...stops.slice(3)];
  }
  // Swipe result: the last stop (Sunset) is deleted.
  if (reached("swipeGone")) {
    stops = stops.slice(0, -1);
  }

  const dragTargetId = day2.stops[2].id; // Pastéis
  const dragShiftId = day2.stops[1].id; // Jerónimos
  const swipeTargetId = day2.stops[4].id; // Sunset
  const checkTargetId = day2.stops[0].id; // Torre de Belém
  const caption = ACT2_CAPTIONS[phase];

  return (
    <div className="spotlight-chat-demo">
      <div className="spotlight-chat-day">
        <div className="spotlight-chat-day-head">
          <span className="spotlight-day-number">Day 2</span>
          {reached("check") && <span className="spotlight-chat-progress">1/{stops.length} done</span>}
        </div>
        <div className="spotlight-chat-stops">
          {stops.map((stop, i) => {
            const isDragging = stop.id === dragTargetId && (phase === "dragPress" || phase === "dragMove");
            const rowClasses = [
              "spotlight-chat-stop",
              stop.id === RELAXED_DAY2_STOP.id && !reached("dragPress") ? "spotlight-chat-stop-new" : "",
              isDragging ? "demo-hold" : "",
              stop.id === dragTargetId && phase === "dragMove" ? "demo-move-up" : "",
              stop.id === dragShiftId && phase === "dragMove" ? "demo-move-down" : "",
              stop.id === swipeTargetId && (phase === "swipe" || phase === "swipeGone") ? "demo-swiping" : "",
              stop.id === checkTargetId && reached("check") ? "demo-done" : "",
            ]
              .filter(Boolean)
              .join(" ");
            return (
              <div key={stop.id} className={rowClasses}>
                <div className="spotlight-chat-stop-content">
                  <span className="spotlight-chat-stop-number">
                    {stop.id === checkTargetId && reached("check") ? "✓" : i + 1}
                  </span>
                  <span className="spotlight-chat-stop-name">{stop.name}</span>
                  <span className="spotlight-chat-stop-time">{stop.timeOfDay}</span>
                </div>
                {isDragging && <span className="demo-finger demo-finger-press" aria-hidden="true" />}
                {stop.id === swipeTargetId && phase === "swipe" && (
                  <span className="demo-finger demo-finger-swipe" aria-hidden="true" />
                )}
                {stop.id === checkTargetId && phase === "check" && (
                  <span className="demo-finger demo-finger-tap" aria-hidden="true" />
                )}
              </div>
            );
          })}
        </div>
      </div>
      {caption && (
        <p key={caption} className={phase === "closing" ? "spotlight-act-caption closing" : "spotlight-act-caption"}>
          {caption}
        </p>
      )}
      <div className="spotlight-chat-thread">
        <div className="spotlight-chat-msg user">
          {USER_MESSAGE.slice(0, typedChars)}
          {phase === "typing" && <span className="spotlight-caret" aria-hidden="true" />}
        </div>
        {phase === "thinking" && (
          <div className="spotlight-chat-msg assistant spotlight-typing" aria-label="Assistant is typing">
            <span />
            <span />
            <span />
          </div>
        )}
        {reached("answered") && <div className="spotlight-chat-msg assistant">{ASSISTANT_MESSAGE}</div>}
      </div>
      {phase === "closing" && (
        <button className="spotlight-replay" onClick={() => setRunId((r) => r + 1)}>
          ↻ Replay
        </button>
      )}
    </div>
  );
}
