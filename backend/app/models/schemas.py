from typing import Literal, Optional

from pydantic import BaseModel

DocumentStatus = Literal["indexed", "processing", "error"]
ThumbnailColor = Literal["red", "blue", "black", "yellow"]
SourceKind = Literal["text", "image"]
MessageRole = Literal["user", "assistant"]


class DocumentItem(BaseModel):
    id: str
    name: str
    category: str
    pages: int
    sizeMb: float
    status: DocumentStatus
    uploadedAt: str
    thumbnailColor: ThumbnailColor
    processingStep: Optional[str] = None


class Group(BaseModel):
    id: str
    name: str


class GroupCreate(BaseModel):
    name: str


class GroupUpdate(BaseModel):
    name: str


class DocumentCategoryUpdate(BaseModel):
    category: str


class DocumentNameUpdate(BaseModel):
    name: str


class DocumentDuplicateRequest(BaseModel):
    category: str


class DocumentImage(BaseModel):
    filename: str
    page: Optional[int] = None
    caption: str
    url: str


class DocumentDetail(DocumentItem):
    markdown: Optional[str] = None
    images: list[DocumentImage] = []


class ChatSource(BaseModel):
    id: str
    kind: SourceKind
    documentName: str
    page: int
    excerpt: Optional[str] = None
    imageUrl: Optional[str] = None
    caption: Optional[str] = None
    # 1-based position in the final ranked list (after hybrid dense+BM25 fusion), not a
    # relevance percentage — RRF scores are only meaningful relative to each other within
    # one query, so showing them as an absolute "% match" was misleading users.
    rank: int


class ChatMessage(BaseModel):
    id: str
    role: MessageRole
    content: str
    sources: Optional[list[ChatSource]] = None
    isStreaming: Optional[bool] = None
    createdAt: str
    conversationId: Optional[str] = None
    # When the scope was chosen automatically by the LLM, the group names it picked.
    # Transient (not persisted) — only set on the live response so the UI can show what
    # was searched; None when scope was manual/all or on reloaded history.
    scopeGroups: Optional[list[str]] = None


class ChatRequest(BaseModel):
    question: str
    documentIds: Optional[list[str]] = None
    conversationId: Optional[str] = None
    # When true (and no explicit documentIds), the LLM picks which groups to search.
    autoScope: bool = False


class ConversationSummary(BaseModel):
    id: str
    title: str
    updatedAt: str


class ConversationDetail(BaseModel):
    id: str
    title: str
    messages: list[ChatMessage]
