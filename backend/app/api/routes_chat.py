from datetime import datetime, timezone
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Request

from app.config import settings
from app.models.schemas import ChatMessage, ChatRequest, ChatSource, ConversationDetail, ConversationSummary
from app.services import conversations_repo, documents_repo, hf_client, mistral_client, vector_store
from app.services.clerk_auth import get_current_user_id

router = APIRouter()


def _auto_scope(question: str) -> tuple[list[str] | None, list[str] | None]:
    """Let the LLM pick which groups to search. Returns (chosen_group_names, document_ids).

    Only indexed documents are considered (others aren't queryable). Returns (None, None)
    when routing can't usefully narrow things — every group is relevant, nothing is
    indexed yet, or the model declined — so the caller searches the whole corpus.
    """
    indexed = [doc for doc in documents_repo.list_documents() if doc.status == "indexed"]
    if not indexed:
        return None, None

    docs_by_group: dict[str, list] = {}
    for doc in indexed:
        docs_by_group.setdefault(doc.category, []).append(doc)

    payload = [{"name": name, "documents": [d.name for d in docs]} for name, docs in docs_by_group.items()]
    chosen = mistral_client.select_relevant_groups(question, payload)

    # Routing that keeps every group is the same as no filter — skip it so the user isn't
    # shown a "searched in: <all groups>" note that implies narrowing that didn't happen.
    if set(chosen) >= set(docs_by_group):
        return None, None

    chosen_set = set(chosen)
    document_ids = [doc.id for doc in indexed if doc.category in chosen_set]
    return chosen, document_ids


@router.get("/api/conversations", response_model=list[ConversationSummary])
def get_conversations(user_id: str = Depends(get_current_user_id)) -> list[ConversationSummary]:
    return conversations_repo.list_conversations(user_id)


@router.get("/api/conversations/{conversation_id}", response_model=ConversationDetail)
def get_conversation(conversation_id: str, user_id: str = Depends(get_current_user_id)) -> ConversationDetail:
    row = _require_owned_conversation(conversation_id, user_id)
    messages = conversations_repo.get_messages(conversation_id)
    return ConversationDetail(id=conversation_id, title=row["title"], messages=messages)


@router.post("/api/chat", response_model=ChatMessage)
def post_chat(payload: ChatRequest, request: Request, user_id: str = Depends(get_current_user_id)) -> ChatMessage:
    if payload.conversationId:
        _require_owned_conversation(payload.conversationId, user_id)
        conversation_id = payload.conversationId
    else:
        conversation_id = conversations_repo.create_conversation(user_id, payload.question)

    user_message = ChatMessage(
        id=f"m-{uuid4()}",
        role="user",
        content=payload.question,
        createdAt=datetime.now(timezone.utc).isoformat(),
    )
    conversations_repo.add_message(conversation_id, user_message)

    # Manual selection always wins; only fall back to LLM group-routing when the user
    # asked for automatic scope and didn't hand-pick documents themselves.
    document_ids = payload.documentIds
    scope_groups: list[str] | None = None
    if not document_ids and payload.autoScope:
        scope_groups, document_ids = _auto_scope(payload.question)

    query_embedding = hf_client.embed_texts([payload.question])[0]
    chunks = vector_store.hybrid_query(
        query_embedding, payload.question, top_k=settings.RAG_TOP_K, document_ids=document_ids
    )

    answer = mistral_client.generate_answer(payload.question, chunks)
    sources = [_to_chat_source(chunk, str(request.base_url).rstrip("/"), i) for i, chunk in enumerate(chunks)]

    assistant_message = ChatMessage(
        id=f"m-{uuid4()}",
        role="assistant",
        content=answer,
        sources=sources,
        createdAt=datetime.now(timezone.utc).isoformat(),
        conversationId=conversation_id,
        scopeGroups=scope_groups,
    )
    conversations_repo.add_message(conversation_id, assistant_message)
    conversations_repo.touch_conversation(conversation_id)

    return assistant_message


def _require_owned_conversation(conversation_id: str, user_id: str):
    row = conversations_repo.get_conversation_row(conversation_id)
    if row is None or row["user_id"] != user_id:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return row


def _to_chat_source(chunk, base_url: str, index: int) -> ChatSource:
    if chunk.chunk_type == "image":
        return ChatSource(
            id=f"s-{index}",
            kind="image",
            documentName=chunk.document_name,
            page=chunk.page or 0,
            imageUrl=f"{base_url}/static/images/{chunk.image_path}",
            caption=chunk.text,
            rank=index + 1,
        )
    return ChatSource(
        id=f"s-{index}",
        kind="text",
        documentName=chunk.document_name,
        page=chunk.page or 0,
        excerpt=chunk.text[:300],
        rank=index + 1,
    )
