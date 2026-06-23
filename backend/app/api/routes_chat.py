from datetime import datetime, timezone
from uuid import uuid4

from fastapi import APIRouter, Request

from app.config import settings
from app.models.schemas import ChatMessage, ChatRequest, ChatSource
from app.services import hf_client, mistral_client, vector_store

router = APIRouter()


@router.get("/api/chat/history", response_model=list[ChatMessage])
def get_chat_history() -> list[ChatMessage]:
    return []


@router.post("/api/chat", response_model=ChatMessage)
def post_chat(payload: ChatRequest, request: Request) -> ChatMessage:
    query_embedding = hf_client.embed_texts([payload.question])[0]
    chunks = vector_store.query(query_embedding, top_k=settings.RAG_TOP_K)

    answer = mistral_client.generate_answer(payload.question, chunks)
    sources = [_to_chat_source(chunk, str(request.base_url).rstrip("/"), i) for i, chunk in enumerate(chunks)]

    return ChatMessage(
        id=f"m-{uuid4()}",
        role="assistant",
        content=answer,
        sources=sources,
        createdAt=datetime.now(timezone.utc).isoformat(),
    )


def _to_chat_source(chunk, base_url: str, index: int) -> ChatSource:
    if chunk.chunk_type == "image":
        return ChatSource(
            id=f"s-{index}",
            kind="image",
            documentName=chunk.document_name,
            page=chunk.page or 0,
            imageUrl=f"{base_url}/static/images/{chunk.image_path}",
            caption=chunk.text,
            score=chunk.score,
        )
    return ChatSource(
        id=f"s-{index}",
        kind="text",
        documentName=chunk.document_name,
        page=chunk.page or 0,
        excerpt=chunk.text[:300],
        score=chunk.score,
    )
