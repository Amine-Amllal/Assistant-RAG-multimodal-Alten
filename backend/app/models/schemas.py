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
