import type { ChatMessage, ConversationDetail, ConversationSummary, DocumentDetail, DocumentItem, Group } from "../types";
import { getAuthToken } from "../lib/authToken";

async function errorMessage(res: Response, fallback: string): Promise<string> {
  try {
    const body = await res.json();
    return typeof body?.detail === "string" ? body.detail : fallback;
  } catch {
    return fallback;
  }
}

async function authHeaders(): Promise<Record<string, string>> {
  const token = await getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function fetchDocuments(): Promise<DocumentItem[]> {
  const res = await fetch("/api/documents");
  if (!res.ok) throw new Error(`Failed to fetch documents: ${res.status}`);
  return res.json();
}

export async function fetchDocumentDetail(id: string): Promise<DocumentDetail> {
  const res = await fetch(`/api/documents/${id}`);
  if (!res.ok) throw new Error(`Failed to fetch document: ${res.status}`);
  return res.json();
}

export function getDocumentDownloadUrl(id: string): string {
  return `/api/documents/${id}/download`;
}

export async function deleteDocument(id: string): Promise<void> {
  const res = await fetch(`/api/documents/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error(`Failed to delete document: ${res.status}`);
}

export async function fetchConversations(): Promise<ConversationSummary[]> {
  const res = await fetch("/api/conversations", { headers: await authHeaders() });
  if (!res.ok) throw new Error(`Failed to fetch conversations: ${res.status}`);
  return res.json();
}

export async function fetchConversation(id: string): Promise<ConversationDetail> {
  const res = await fetch(`/api/conversations/${id}`, { headers: await authHeaders() });
  if (!res.ok) throw new Error(`Failed to fetch conversation: ${res.status}`);
  return res.json();
}

export async function sendChatMessage(
  question: string,
  options?: { documentIds?: string[]; conversationId?: string; autoScope?: boolean },
): Promise<ChatMessage> {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(await authHeaders()) },
    body: JSON.stringify({
      question,
      documentIds: options?.documentIds?.length ? options.documentIds : undefined,
      conversationId: options?.conversationId,
      autoScope: options?.autoScope ?? false,
    }),
  });
  if (!res.ok) throw new Error(`Failed to send message: ${res.status}`);
  return res.json();
}

export async function uploadDocument(file: File, category?: string): Promise<DocumentItem> {
  const formData = new FormData();
  formData.append("file", file);
  if (category) formData.append("category", category);
  const res = await fetch("/api/documents/upload", { method: "POST", body: formData });
  if (!res.ok) throw new Error(`Failed to upload document: ${res.status}`);
  return res.json();
}

export async function updateDocumentCategory(id: string, category: string): Promise<DocumentItem> {
  const res = await fetch(`/api/documents/${id}/category`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ category }),
  });
  if (!res.ok) throw new Error(await errorMessage(res, `Failed to update category: ${res.status}`));
  return res.json();
}

export async function updateDocumentName(id: string, name: string): Promise<DocumentItem> {
  const res = await fetch(`/api/documents/${id}/name`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) throw new Error(await errorMessage(res, `Failed to rename document: ${res.status}`));
  return res.json();
}

export async function duplicateDocument(id: string, category: string): Promise<DocumentItem> {
  const res = await fetch(`/api/documents/${id}/duplicate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ category }),
  });
  if (!res.ok) throw new Error(await errorMessage(res, `Failed to duplicate document: ${res.status}`));
  return res.json();
}

export async function fetchGroups(): Promise<Group[]> {
  const res = await fetch("/api/groups");
  if (!res.ok) throw new Error(`Failed to fetch groups: ${res.status}`);
  return res.json();
}

export async function createGroup(name: string): Promise<Group> {
  const res = await fetch("/api/groups", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) throw new Error(await errorMessage(res, `Failed to create group: ${res.status}`));
  return res.json();
}

export async function renameGroup(id: string, name: string): Promise<Group> {
  const res = await fetch(`/api/groups/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) throw new Error(await errorMessage(res, `Failed to rename group: ${res.status}`));
  return res.json();
}

export async function deleteGroup(id: string): Promise<void> {
  const res = await fetch(`/api/groups/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error(await errorMessage(res, `Failed to delete group: ${res.status}`));
}
