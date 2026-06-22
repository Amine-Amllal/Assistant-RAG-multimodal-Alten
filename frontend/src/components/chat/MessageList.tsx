import { useEffect, useRef } from "react";
import type { ChatMessage } from "../../types";
import { MessageBubble } from "./MessageBubble";
import { EmptyState } from "../ui/EmptyState";
import "./MessageList.css";

export function MessageList({ messages }: { messages: ChatMessage[] }) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, messages[messages.length - 1]?.isStreaming]);

  if (messages.length === 0) {
    return (
      <div className="message-list message-list--empty">
        <EmptyState
          title="Ask anything about your technical documents"
          description="Query specs, manuals, and research papers. Answers cite the exact page, paragraph, or figure they come from."
        />
      </div>
    );
  }

  return (
    <div className="message-list">
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
