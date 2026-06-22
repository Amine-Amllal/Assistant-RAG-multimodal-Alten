import type { ChatMessage } from "../../types";
import { SourceCard } from "./SourceCard";
import { Spinner } from "../ui/Spinner";
import "./MessageBubble.css";

export function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  return (
    <div className={`message-row ${isUser ? "message-row--user" : ""}`}>
      <div className={`message-avatar ${isUser ? "message-avatar--user" : ""}`} aria-hidden="true">
        {isUser ? "U" : "AI"}
      </div>

      <div className="message-content">
        <div className={`message-bubble ${isUser ? "message-bubble--user" : ""}`}>
          {message.isStreaming ? (
            <span className="message-bubble__loading">
              <Spinner size={14} /> Thinking…
            </span>
          ) : (
            <p>{message.content}</p>
          )}
        </div>

        {!isUser && message.sources && message.sources.length > 0 && (
          <div className="message-sources">
            <span className="message-sources__label">Sources</span>
            <div className="message-sources__list">
              {message.sources.map((source) => (
                <SourceCard key={source.id} source={source} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
