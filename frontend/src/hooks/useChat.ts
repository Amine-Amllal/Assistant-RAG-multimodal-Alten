import { useEffect, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import type { ChatMessage, ConversationSummary } from "../types";
import { fetchConversation, fetchConversations, sendChatMessage } from "../api/client";

export function useChat() {
  const { isLoaded, isSignedIn } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<string[]>([]);
  // "auto" lets the LLM pick which groups to search per question; "manual" uses
  // selectedDocumentIds (empty = whole corpus). Auto is the default.
  const [scopeMode, setScopeMode] = useState<"auto" | "manual">("auto");

  function refreshConversations() {
    fetchConversations().then(setConversations).catch(console.error);
  }

  useEffect(() => {
    // Wait for Clerk to confirm a session before fetching: firing this immediately on
    // mount risked racing the token-getter registration (see App.tsx) and, more
    // importantly, didn't retry after a sign-out -> sign-in cycle, since this effect's
    // dependency-less mount only ever ran once per ChatView mount — so a sign-in landing
    // straight back on /chat without a full remount could just keep showing the empty
    // list from the previous (signed-out) fetch attempt.
    if (isLoaded && isSignedIn) {
      refreshConversations();
    } else {
      setConversations([]);
    }
  }, [isLoaded, isSignedIn]);

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

    const reply = await sendChatMessage(question, {
      documentIds: scopeMode === "manual" ? selectedDocumentIds : undefined,
      autoScope: scopeMode === "auto",
      conversationId: conversationId ?? undefined,
    });

    setMessages((prev) => prev.map((m) => (m.id === placeholder.id ? reply : m)));

    if (!conversationId && reply.conversationId) {
      setConversationId(reply.conversationId);
    }
    refreshConversations();
  }

  function clear() {
    setMessages([]);
    setConversationId(null);
  }

  async function selectConversation(id: string) {
    const detail = await fetchConversation(id);
    setConversationId(detail.id);
    setMessages(detail.messages);
  }

  const isAnswering = messages[messages.length - 1]?.isStreaming ?? false;

  return {
    messages,
    isAnswering,
    ask,
    clear,
    selectedDocumentIds,
    setSelectedDocumentIds,
    scopeMode,
    setScopeMode,
    conversations,
    conversationId,
    selectConversation,
  };
}
