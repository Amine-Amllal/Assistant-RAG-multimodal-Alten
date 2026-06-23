from dataclasses import dataclass
from functools import lru_cache
from uuid import uuid4

import chromadb

from app.config import settings
from app.storage.paths import chroma_dir


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


def query(embedding: list[float], top_k: int) -> list[RetrievedChunk]:
    results = _collection().query(query_embeddings=[embedding], n_results=top_k)
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
