export type DocumentStatus = "indexed" | "processing" | "error";

export interface DocumentItem {
  id: string;
  name: string;
  category: "Research Paper" | "Technical Manual" | "Engineering Guide";
  pages: number;
  sizeMb: number;
  status: DocumentStatus;
  uploadedAt: string;
  thumbnailColor: "red" | "blue" | "black" | "yellow";
}

export type SourceKind = "text" | "image";

export interface ChatSource {
  id: string;
  kind: SourceKind;
  documentName: string;
  page: number;
  excerpt?: string;
  imageUrl?: string;
  caption?: string;
  score: number;
}

export type MessageRole = "user" | "assistant";

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  sources?: ChatSource[];
  isStreaming?: boolean;
  createdAt: string;
}
