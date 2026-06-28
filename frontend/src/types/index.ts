export type DocumentStatus = "indexed" | "processing" | "error";

export interface DocumentItem {
  id: string;
  name: string;
  category: string;
  pages: number;
  sizeMb: number;
  status: DocumentStatus;
  uploadedAt: string;
  thumbnailColor: "red" | "blue" | "black" | "yellow";
  processingStep: string | null;
}

export interface Group {
  id: string;
  name: string;
}

export interface DocumentImage {
  filename: string;
  page: number | null;
  caption: string;
  url: string;
}

export interface DocumentDetail extends DocumentItem {
  markdown: string | null;
  images: DocumentImage[];
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
  rank: number;
}

export type MessageRole = "user" | "assistant";

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  sources?: ChatSource[];
  isStreaming?: boolean;
  createdAt: string;
  conversationId?: string;
  scopeGroups?: string[];
}

export interface ConversationSummary {
  id: string;
  title: string;
  updatedAt: string;
}

export interface ConversationDetail {
  id: string;
  title: string;
  messages: ChatMessage[];
}
