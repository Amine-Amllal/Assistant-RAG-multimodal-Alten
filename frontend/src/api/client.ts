import type { ChatMessage, DocumentItem } from "../types";
import { mockDocuments, mockMessages } from "../data/mockData";

/**
 * Frontend-only stub. Replace each function body with a real fetch
 * to the FastAPI backend (e.g. `fetch("/api/chat", ...)`) once it exists.
 */

const SIMULATED_LATENCY_MS = 600;

function delay<T>(value: T, ms = SIMULATED_LATENCY_MS): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export async function fetchDocuments(): Promise<DocumentItem[]> {
  return delay(mockDocuments);
}

export async function fetchChatHistory(): Promise<ChatMessage[]> {
  return delay(mockMessages);
}

export async function sendChatMessage(question: string): Promise<ChatMessage> {
  const reply: ChatMessage = {
    id: `m-${Date.now()}`,
    role: "assistant",
    content: `This is a placeholder answer for: "${question}". Connect this to the FastAPI /chat endpoint to get real, grounded responses with citations.`,
    createdAt: new Date().toISOString(),
    sources: [],
  };
  return delay(reply, 900);
}

export async function uploadDocument(file: File): Promise<DocumentItem> {
  const newDoc: DocumentItem = {
    id: `doc-${Date.now()}`,
    name: file.name,
    category: "Technical Manual",
    pages: 0,
    sizeMb: Math.round((file.size / (1024 * 1024)) * 10) / 10,
    status: "processing",
    uploadedAt: new Date().toISOString().slice(0, 10),
    thumbnailColor: "blue",
  };
  return delay(newDoc, 800);
}
