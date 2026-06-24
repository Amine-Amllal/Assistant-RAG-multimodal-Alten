import type { ChatMessage, DocumentDetail, DocumentItem, Group } from "../types";

async function errorMessage(res: Response, fallback: string): Promise<string> {
  try {
    const body = await res.json();
    return typeof body?.detail === "string" ? body.detail : fallback;
  } catch {
    return fallback;
  }
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
