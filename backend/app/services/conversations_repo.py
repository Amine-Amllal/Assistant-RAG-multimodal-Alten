import json
from datetime import datetime, timezone
from uuid import uuid4

from app.database import get_connection
from app.models.schemas import ChatMessage, ChatSource, ConversationSummary
from app.services import cache

TITLE_MAX_LENGTH = 60


def _list_cache_key(user_id: str) -> str:
    return f"conv:list:{user_id}"


def _messages_cache_key(conversation_id: str) -> str:
    return f"conv:msgs:{conversation_id}"


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _title_from_question(question: str) -> str:
    question = question.strip()
    return question if len(question) <= TITLE_MAX_LENGTH else question[: TITLE_MAX_LENGTH - 1].rstrip() + "…"


def create_conversation(user_id: str, first_question: str) -> str:
    conversation_id = str(uuid4())
    now = _now()
    with get_connection() as conn:
        conn.execute(
            "INSERT INTO conversations (id, user_id, title, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
            (conversation_id, user_id, _title_from_question(first_question), now, now),
        )
    cache.delete(_list_cache_key(user_id))
    return conversation_id


def touch_conversation(conversation_id: str) -> None:
    with get_connection() as conn:
        conn.execute("UPDATE conversations SET updated_at = ? WHERE id = ?", (_now(), conversation_id))
    # updated_at drives the conversation-list ordering, so the cached list is now stale.
    row = get_conversation_row(conversation_id)
    if row is not None:
        cache.delete(_list_cache_key(row["user_id"]))


def get_conversation_row(conversation_id: str):
    with get_connection() as conn:
        return conn.execute("SELECT * FROM conversations WHERE id = ?", (conversation_id,)).fetchone()


def list_conversations(user_id: str) -> list[ConversationSummary]:
    key = _list_cache_key(user_id)
    cached = cache.get_json(key)
    if cached is not None:
        return [ConversationSummary(**item) for item in cached]

    with get_connection() as conn:
        rows = conn.execute(
            "SELECT id, title, updated_at FROM conversations WHERE user_id = ? ORDER BY updated_at DESC",
            (user_id,),
        ).fetchall()
    summaries = [ConversationSummary(id=row["id"], title=row["title"], updatedAt=row["updated_at"]) for row in rows]
    cache.set_json(key, [s.model_dump() for s in summaries])
    return summaries


def add_message(conversation_id: str, message: ChatMessage) -> None:
    sources_json = json.dumps([s.model_dump() for s in message.sources]) if message.sources else None
    with get_connection() as conn:
        conn.execute(
            "INSERT INTO messages (id, conversation_id, role, content, sources_json, created_at) "
            "VALUES (?, ?, ?, ?, ?, ?)",
            (message.id, conversation_id, message.role, message.content, sources_json, message.createdAt),
        )
    cache.delete(_messages_cache_key(conversation_id))


def get_messages(conversation_id: str) -> list[ChatMessage]:
    key = _messages_cache_key(conversation_id)
    cached = cache.get_json(key)
    if cached is not None:
        return [ChatMessage(**item) for item in cached]

    with get_connection() as conn:
        rows = conn.execute(
            "SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC",
            (conversation_id,),
        ).fetchall()
    messages = []
    for row in rows:
        sources = _parse_sources(row["sources_json"])
        messages.append(
            ChatMessage(
                id=row["id"],
                role=row["role"],
                content=row["content"],
                sources=sources,
                createdAt=row["created_at"],
            )
        )
    cache.set_json(key, [m.model_dump() for m in messages])
    return messages


def _parse_sources(sources_json: str | None) -> list[ChatSource] | None:
    if not sources_json:
        return None
    sources = []
    for i, raw in enumerate(json.loads(sources_json)):
        # Messages stored before the dense/BM25 hybrid retrieval change had a `score`
        # (relevance percentage) field instead of `rank` — backfill it from list position
        # so old conversations still load instead of failing Pydantic validation.
        if "rank" not in raw:
            raw = {**raw, "rank": i + 1}
        raw.pop("score", None)
        sources.append(ChatSource(**raw))
    return sources
