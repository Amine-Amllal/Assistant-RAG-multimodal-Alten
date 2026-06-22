import { useEffect, useState } from "react";
import type { ChatMessage } from "../types";
import { fetchChatHistory, sendChatMessage } from "../api/client";

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  useEffect(() => {
    fetchChatHistory()
      .then(setMessages)
      .finally(() => setIsLoadingHistory(false));
  }, []);

  async function ask(question: string) {
    const userMessage: ChatMessage = {
      id: `m-${Date.now()}-user`,
      role: "user",
      content: question,
      createdAt: new Date().toISOString(),
    };

    const placeholder: ChatMessage = {
      id: `m-${Date.now()}-assistant`,
      role: "assistant",
      content: "",
      isStreaming: true,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage, placeholder]);

    const reply = await sendChatMessage(question);

    setMessages((prev) => prev.map((m) => (m.id === placeholder.id ? reply : m)));
  }

  function clear() {
    setMessages([]);
  }

  const isAnswering = messages[messages.length - 1]?.isStreaming ?? false;

  return { messages, isLoadingHistory, isAnswering, ask, clear };
}
