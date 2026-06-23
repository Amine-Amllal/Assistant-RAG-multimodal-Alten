import type { ChatMessage, DocumentItem } from "../types";

export async function fetchDocuments(): Promise<DocumentItem[]> {
  const res = await fetch("/api/documents");
  if (!res.ok) throw new Error(`Failed to fetch documents: ${res.status}`);
  return res.json();
}

export async function fetchChatHistory(): Promise<ChatMessage[]> {
  const res = await fetch("/api/chat/history");
  if (!res.ok) throw new Error(`Failed to fetch chat history: ${res.status}`);
  return res.json();
}

export async function sendChatMessage(question: string): Promise<ChatMessage> {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question }),
  });
  if (!res.ok) throw new Error(`Failed to send message: ${res.status}`);
  return res.json();
}

export async function uploadDocument(file: File): Promise<DocumentItem> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch("/api/documents/upload", { method: "POST", body: formData });
  if (!res.ok) throw new Error(`Failed to upload document: ${res.status}`);
  return res.json();
}
