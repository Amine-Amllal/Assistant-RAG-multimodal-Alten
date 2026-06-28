"""Re-embed the existing Chroma collection in place with the current EMBEDDING_BACKEND.

Use this after switching EMBEDDING_BACKEND (e.g. e5-large -> mistral): the stored chunk
texts and figure captions are kept, only their vectors are recomputed and updated. This
avoids a full re-ingestion (no Docling parsing, no VLM captioning) — it just moves the
existing index into the new embedding space so retrieval works again.

Run from backend/:  python scripts/reembed_collection.py
"""

import sys
from pathlib import Path

# Allow running as `python scripts/reembed_collection.py` from backend/.
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import truststore  # noqa: E402

truststore.inject_into_ssl()

from app.config import settings  # noqa: E402
from app.services import hf_client, vector_store  # noqa: E402


def main() -> None:
    collection = vector_store._collection()
    total = collection.count()
    print(f"Backend: {settings.EMBEDDING_BACKEND} | collection: {total} chunks")
    if total == 0:
        print("Nothing to re-embed.")
        return

    data = collection.get(include=["documents", "metadatas"])
    ids = data["ids"]
    documents = data["documents"]
    metadatas = data["metadatas"]

    print(f"Embedding {len(documents)} texts with {settings.EMBEDDING_BACKEND}...")
    embeddings = hf_client.embed_texts(documents)

    # upsert with the SAME ids/documents/metadatas — only the vectors change.
    collection.upsert(
        ids=ids, embeddings=embeddings, documents=documents, metadatas=metadatas
    )
    vector_store._mark_bm25_dirty()
    print(f"Done. Re-embedded {len(ids)} chunks (dim={len(embeddings[0])}).")


if __name__ == "__main__":
    main()
