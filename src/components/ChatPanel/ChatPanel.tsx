import type { ChatMessage } from "../../types";
import { ChatHistory } from "./ChatHistory";
import { ChatInput } from "./ChatInput";

interface Props {
  messages: ChatMessage[];
  loading: boolean;
  onSend: (message: string) => void;
  tidySuggestion?: string | null;
  onTidyAccept?: () => void;
  onTidyDismiss?: () => void;
}

export function ChatPanel({
  messages,
  loading,
  onSend,
  tidySuggestion = null,
  onTidyAccept,
  onTidyDismiss,
}: Props) {
  return (
    <div className="chat-panel">
      <h3>Tailor your trip</h3>
      <ChatHistory messages={messages} loading={loading} />
      {tidySuggestion && !loading && (
        <div className="tidy-chip">
          <button className="tidy-chip-action" onClick={onTidyAccept}>
            ✨ {tidySuggestion}
          </button>
          <button className="tidy-chip-dismiss" onClick={onTidyDismiss} aria-label="Dismiss suggestion">
            &times;
          </button>
        </div>
      )}
      <ChatInput disabled={loading} onSend={onSend} />
    </div>
  );
}
