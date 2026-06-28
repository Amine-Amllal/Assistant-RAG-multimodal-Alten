import re
import threading
from dataclasses import dataclass
from functools import lru_cache
from uuid import uuid4

import chromadb
from rank_bm25 import BM25Okapi

from app.config import settings
from app.storage.paths import chroma_dir

_TOKEN_RE = re.compile(r"\w+")

# RRF's rank-based fusion needs no normalization between dense distances and BM25 scores,
# which live on totally different scales — only each list's *ordering* matters. 60 is the
# constant from the original Cormack et al. reciprocal rank fusion paper; it just damps the
# weight of low ranks and isn't sensitive to this corpus's size.
_RRF_K = 60


@dataclass
class RetrievedChunk:
    document_id: str
    document_name: str
    page: int | None
    chunk_type: str  # "text" | "image"
    text: str
    image_path: str | None
    score: float


@lru_cache
def _collection():
    client = chromadb.PersistentClient(path=str(chroma_dir()))
    return client.get_or_create_collection(name=settings.CHROMA_COLLECTION_NAME)


def _tokenize(text: str) -> list[str]:
    return _TOKEN_RE.findall(text.lower())


# BM25 needs the full corpus in memory to score against; Chroma's collection is the source
# of truth, so this is rebuilt from it lazily rather than maintained incrementally. Cheap
# enough at this corpus size, and avoids a second persistent index to keep in sync.
_bm25_lock = threading.Lock()
_bm25_dirty = True
_bm25_cache: dict | None = None


def _mark_bm25_dirty() -> None:
    global _bm25_dirty
    with _bm25_lock:
        _bm25_dirty = True


def _get_bm25_index() -> dict:
    global _bm25_dirty, _bm25_cache
    with _bm25_lock:
        if not _bm25_dirty and _bm25_cache is not None:
            return _bm25_cache

        results = _collection().get(include=["documents", "metadatas"])
        documents = results["documents"] or []
        metadatas = results["metadatas"] or []
        tokenized = [_tokenize(doc) for doc in documents]
        bm25 = BM25Okapi(tokenized) if tokenized else None

        _bm25_cache = {"bm25": bm25, "documents": documents, "metadatas": metadatas}
        _bm25_dirty = False
        return _bm25_cache


def upsert_text_chunks(document_id: str, document_name: str, chunks, embeddings: list[list[float]]) -> None:
    if not chunks:
        return
    ids = [f"{document_id}-text-{uuid4()}" for _ in chunks]
    metadatas = [
        {
            "document_id": document_id,
            "document_name": document_name,
            "page": chunk.page if chunk.page is not None else -1,
            "chunk_type": "text",
            "image_path": "",
        }
        for chunk in chunks
    ]
    documents = [chunk.text for chunk in chunks]
    _collection().upsert(ids=ids, embeddings=embeddings, metadatas=metadatas, documents=documents)
    _mark_bm25_dirty()


def upsert_image_chunks(document_id: str, document_name: str, image_records, embeddings: list[list[float]]) -> None:
    if not image_records:
        return
    ids = [f"{document_id}-image-{uuid4()}" for _ in image_records]
    metadatas = [
        {
            "document_id": document_id,
            "document_name": document_name,
            "page": record.page if record.page is not None else -1,
            "chunk_type": "image",
            "image_path": f"{document_id}/{record.filename}",
        }
        for record in image_records
    ]
    documents = [record.caption for record in image_records]
    _collection().upsert(ids=ids, embeddings=embeddings, metadatas=metadatas, documents=documents)
    _mark_bm25_dirty()


def delete_document(document_id: str) -> None:
    _collection().delete(where={"document_id": document_id})
    _mark_bm25_dirty()


def get_image_chunks(document_id: str) -> list[RetrievedChunk]:
    results = _collection().get(
        where={"$and": [{"document_id": document_id}, {"chunk_type": "image"}]},
    )
    if not results["ids"]:
        return []

    chunks: list[RetrievedChunk] = []
    for doc_text, metadata in zip(results["documents"], results["metadatas"]):
        page = metadata["page"]
        chunks.append(
            RetrievedChunk(
                document_id=metadata["document_id"],
                document_name=metadata["document_name"],
                page=page if page != -1 else None,
                chunk_type=metadata["chunk_type"],
                text=doc_text,
                image_path=metadata["image_path"] or None,
                score=1.0,
            )
        )
    return sorted(chunks, key=lambda c: (c.page is None, c.page))


def query(
    embedding: list[float],
    top_k: int,
    document_ids: list[str] | None = None,
    chunk_type: str | None = None,
) -> list[RetrievedChunk]:
    filters = []
    if document_ids:
        filters.append({"document_id": {"$in": document_ids}})
    if chunk_type:
        filters.append({"chunk_type": chunk_type})
    where = filters[0] if len(filters) == 1 else {"$and": filters} if filters else None

    results = _collection().query(query_embeddings=[embedding], n_results=top_k, where=where)
    if not results["ids"][0]:
        return []

    chunks: list[RetrievedChunk] = []
    for doc_text, metadata, distance in zip(
        results["documents"][0], results["metadatas"][0], results["distances"][0]
    ):
        page = metadata["page"]
        chunks.append(
            RetrievedChunk(
                document_id=metadata["document_id"],
                document_name=metadata["document_name"],
                page=page if page != -1 else None,
                chunk_type=metadata["chunk_type"],
                text=doc_text,
                image_path=metadata["image_path"] or None,
                score=max(0.0, min(1.0, 1 - distance)),
            )
        )
    return chunks


def bm25_search(
    query_text: str,
    top_k: int,
    document_ids: list[str] | None = None,
    chunk_type: str | None = None,
) -> list[RetrievedChunk]:
    index = _get_bm25_index()
    bm25 = index["bm25"]
    if bm25 is None:
        return []

    scores = bm25.get_scores(_tokenize(query_text))

    candidates = []
    for i, metadata in enumerate(index["metadatas"]):
        if scores[i] <= 0:
            continue
        if document_ids and metadata["document_id"] not in document_ids:
            continue
        if chunk_type and metadata["chunk_type"] != chunk_type:
            continue
        candidates.append((scores[i], i))
    candidates.sort(key=lambda pair: pair[0], reverse=True)

    top_score = candidates[0][0] if candidates else 1.0
    chunks: list[RetrievedChunk] = []
    for score, i in candidates[:top_k]:
        metadata = index["metadatas"][i]
        page = metadata["page"]
        chunks.append(
            RetrievedChunk(
                document_id=metadata["document_id"],
                document_name=metadata["document_name"],
                page=page if page != -1 else None,
                chunk_type=metadata["chunk_type"],
                text=index["documents"][i],
                image_path=metadata["image_path"] or None,
                score=max(0.0, min(1.0, score / top_score)),
            )
        )
    return chunks


def _chunk_key(chunk: RetrievedChunk) -> tuple:
    return (chunk.document_id, chunk.chunk_type, chunk.image_path or chunk.text)


def hybrid_query(
    embedding: list[float],
    query_text: str,
    top_k: int,
    document_ids: list[str] | None = None,
    chunk_type: str | None = None,
) -> list[RetrievedChunk]:
    # Dense (semantic) and BM25 (exact keyword) retrieval find different things — dense
    # catches conceptual matches, BM25 catches exact terms like "Figure 1" that embed too
    # similarly to "Figure 2" for cosine similarity to tell apart. Reciprocal rank fusion
    # combines their rankings without needing their scores to be on comparable scales.
    fanout = max(top_k * 3, 10)
    dense_results = query(embedding, top_k=fanout, document_ids=document_ids, chunk_type=chunk_type)
    sparse_results = bm25_search(query_text, top_k=fanout, document_ids=document_ids, chunk_type=chunk_type)

    fused_scores: dict[tuple, float] = {}
    chunk_by_key: dict[tuple, RetrievedChunk] = {}
    for results in (dense_results, sparse_results):
        for rank, chunk in enumerate(results):
            key = _chunk_key(chunk)
            chunk_by_key.setdefault(key, chunk)
            fused_scores[key] = fused_scores.get(key, 0.0) + 1.0 / (_RRF_K + rank + 1)

    ranked_keys = sorted(fused_scores, key=lambda k: fused_scores[k], reverse=True)[:top_k]
    if not ranked_keys:
        return []

    max_score = fused_scores[ranked_keys[0]]
    merged: list[RetrievedChunk] = []
    for key in ranked_keys:
        chunk = chunk_by_key[key]
        merged.append(
            RetrievedChunk(
                document_id=chunk.document_id,
                document_name=chunk.document_name,
                page=chunk.page,
                chunk_type=chunk.chunk_type,
                text=chunk.text,
                image_path=chunk.image_path,
                score=fused_scores[key] / max_score if max_score > 0 else 0.0,
            )
        )
    return merged
