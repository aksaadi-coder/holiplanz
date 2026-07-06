import { useEffect, useState } from "react";
import { RELAXED_DAY2_STOP, SAMPLE_TRIP } from "../../data/sampleTrip";

const USER_MESSAGE = "Make day 2 more relaxed";
const ASSISTANT_MESSAGE =
  "Done! I swapped the museum visit for a slow riverside afternoon, so day 2 now winds down gently after the pastéis.";
const TYPE_MS = 45;

type Phase = "typing" | "thinking" | "answered";

// Scripted chat replay: the demo "user" types a request, the assistant answers,
// and day 2 visibly updates alongside — chat and itinerary moving together.
export function SpotlightChat() {
  const [runId, setRunId] = useState(0);
  const [typedChars, setTypedChars] = useState(0);
  const [phase, setPhase] = useState<Phase>("typing");

  useEffect(() => {
    setTypedChars(0);
    setPhase("typing");
    const timers: ReturnType<typeof setTimeout>[] = [];
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
    timers.push(setTimeout(() => setPhase("thinking"), typeDuration + 400));
    timers.push(setTimeout(() => setPhase("answered"), typeDuration + 2000));
    return () => {
      clearInterval(interval);
      timers.forEach(clearTimeout);
    };
  }, [runId]);

  const day2 = SAMPLE_TRIP.days.find((d) => d.dayNumber === 2)!;
  const stops =
    phase === "answered"
      ? day2.stops.map((s) => (s.name === "MAAT" ? RELAXED_DAY2_STOP : s))
      : day2.stops;

  return (
    <div className="spotlight-chat-demo">
      <div className="spotlight-chat-day">
        <span className="spotlight-day-number">Day 2</span>
        <div className="spotlight-chat-stops">
          {stops.map((stop, i) => (
            <div
              key={stop.id}
              className={
                stop.id === RELAXED_DAY2_STOP.id
                  ? "spotlight-chat-stop spotlight-chat-stop-new"
                  : "spotlight-chat-stop"
              }
            >
              <span className="spotlight-chat-stop-number">{i + 1}</span>
              <span className="spotlight-chat-stop-name">{stop.name}</span>
              <span className="spotlight-chat-stop-time">{stop.timeOfDay}</span>
            </div>
          ))}
        </div>
      </div>
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
        {phase === "answered" && <div className="spotlight-chat-msg assistant">{ASSISTANT_MESSAGE}</div>}
      </div>
      {phase === "answered" && (
        <button className="spotlight-replay" onClick={() => setRunId((r) => r + 1)}>
          ↻ Replay
        </button>
      )}
    </div>
  );
}
