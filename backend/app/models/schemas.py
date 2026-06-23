from typing import Literal, Optional

from pydantic import BaseModel

DocumentStatus = Literal["indexed", "processing", "error"]
DocumentCategory = Literal["Research Paper", "Technical Manual", "Engineering Guide"]
ThumbnailColor = Literal["red", "blue", "black", "yellow"]
SourceKind = Literal["text", "image"]
MessageRole = Literal["user", "assistant"]


class DocumentItem(BaseModel):
    id: str
    name: str
    category: DocumentCategory
    pages: int
    sizeMb: float
    status: DocumentStatus
    uploadedAt: str
    thumbnailColor: ThumbnailColor


class ChatSource(BaseModel):
    id: str
    kind: SourceKind
    documentName: str
    page: int
    excerpt: Optional[str] = None
    imageUrl: Optional[str] = None
    caption: Optional[str] = None
    score: float


class ChatMessage(BaseModel):
    id: str
    role: MessageRole
    content: str
    sources: Optional[list[ChatSource]] = None
    isStreaming: Optional[bool] = None
    createdAt: str


class ChatRequest(BaseModel):
    question: str
