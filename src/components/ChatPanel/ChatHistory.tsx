import { useEffect, useRef } from "react";
import type { ChatMessage } from "../../types";

interface Props {
  messages: ChatMessage[];
  loading: boolean;
}

export function ChatHistory({ messages, loading }: Props) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  return (
    <div className="chat-history">
      {messages.length === 0 && (
        <p className="chat-empty">
          Ask me to tailor the trip - e.g. "make day 2 more relaxed" or "we're traveling with kids".
        </p>
      )}
      {messages.map((m) => (
        <div key={m.id} className={`chat-message chat-${m.role}`}>
          {m.content}
        </div>
      ))}
      {loading && <div className="chat-message chat-assistant chat-loading">Thinking...</div>}
      <div ref={endRef} />
    </div>
  );
}
