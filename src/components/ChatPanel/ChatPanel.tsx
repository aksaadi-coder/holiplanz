import type { ChatMessage } from "../../types";
import { ChatHistory } from "./ChatHistory";
import { ChatInput } from "./ChatInput";

interface Props {
  messages: ChatMessage[];
  loading: boolean;
  onSend: (message: string) => void;
}

export function ChatPanel({ messages, loading, onSend }: Props) {
  return (
    <div className="chat-panel">
      <h3>Tailor your trip</h3>
      <ChatHistory messages={messages} loading={loading} />
      <ChatInput disabled={loading} onSend={onSend} />
    </div>
  );
}
