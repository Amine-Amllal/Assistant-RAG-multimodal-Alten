import json
import re
from functools import lru_cache

import numpy as np
from mistralai.client import Mistral

from app.config import settings
from app.services.vector_store import RetrievedChunk

GROUP_ROUTER_SYSTEM_PROMPT = (
    "You route a user question to the document groups that might contain the answer. "
    "You are given the list of groups and the documents inside each. Select ONLY the "
    "groups plausibly relevant to the question — but be inclusive when unsure, since "
    "missing the right group means the answer can't be found. Respond with ONLY a JSON "
    'object of the form {"groups": ["Group A", "Group B"]}, using the exact group names '
    "given. If nothing clearly applies, include all groups."
)

SYSTEM_PROMPT = (
    "You are a technical assistant answering questions about a corpus of research papers "
    "and technical manuals. Use ONLY the numbered sources below to answer. Cite sources "
    "inline using [Source N]. If the sources do not contain the answer, say so explicitly "
    "instead of guessing.\n\n"
    "Some sources are figures/diagrams (their content below is the figure's caption, not "
    "body text). The application automatically displays the actual image to the user "
    "right below your answer whenever you cite that source — you never need to apologize "
    "for being unable to show images. When a figure source answers the question, just say "
    "something like 'Voici la figure demandée [Source N]' (or the English equivalent) and "
    "briefly describe what it shows."
)


@lru_cache
def _client() -> Mistral:
    return Mistral(api_key=settings.MISTRAL_API_KEY)


def embed_texts(texts: list[str]) -> list[list[float]]:
    """Embed texts with Mistral's `mistral-embed` (1024-dim), L2-normalized.

    Used when EMBEDDING_BACKEND=mistral. Vectors are normalized to unit length so that
    Chroma's L2 distance ranks them like cosine similarity — matching how the rest of the
    pipeline treats embeddings (and keeping `score = 1 - distance` meaningful). Sent in
    batches: one request carries many texts, which keeps well under the free tier's ~1 req/s
    limit and is far faster than one call per text.
    """
    if not texts:
        return []

    client = _client()
    embeddings: list[list[float]] = []
    batch_size = 32
    for start in range(0, len(texts), batch_size):
        batch = texts[start : start + batch_size]
        response = client.embeddings.create(model=settings.MISTRAL_EMBED_MODEL, inputs=batch)
        for item in response.data:
            vector = np.asarray(item.embedding, dtype=float)
            norm = np.linalg.norm(vector)
            if norm > 0:
                vector = vector / norm
            embeddings.append(vector.tolist())
    return embeddings


def select_relevant_groups(question: str, groups: list[dict]) -> list[str]:
    """Ask the LLM which groups to search for this question.

    `groups` is a list of {"name": str, "documents": list[str]}. Returns the subset of
    group names worth searching. On any failure (or an empty/ambiguous answer) falls back
    to all groups, so routing can never make the corpus narrower than the user expects by
    accident — it only ever prunes when the model is confident.
    """
    if not groups:
        return []

    all_names = [g["name"] for g in groups]
    catalog = "\n".join(
        f'- "{g["name"]}": {", ".join(g["documents"]) if g["documents"] else "(no documents)"}'
        for g in groups
    )
    user_content = f"Groups and their documents:\n{catalog}\n\nQuestion: {question}"

    try:
        response = _client().chat.complete(
            model=settings.MISTRAL_MODEL,
            messages=[
                {"role": "system", "content": GROUP_ROUTER_SYSTEM_PROMPT},
                {"role": "user", "content": user_content},
            ],
            temperature=0,
        )
        content = response.choices[0].message.content
        match = re.search(r"\{.*\}", content, re.DOTALL)
        chosen = json.loads(match.group(0)).get("groups", []) if match else []
    except Exception:
        return all_names

    valid = {name for name in chosen if name in set(all_names)}
    return [name for name in all_names if name in valid] or all_names


def generate_answer(question: str, chunks: list[RetrievedChunk]) -> str:
    context_block = "\n\n".join(
        f"[Source {i + 1}] ({chunk.document_name}, page {chunk.page}): {chunk.text}"
        for i, chunk in enumerate(chunks)
    )
    user_content = f"Sources:\n{context_block}\n\nQuestion: {question}"

    response = _client().chat.complete(
        model=settings.MISTRAL_MODEL,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_content},
        ],
    )
    return response.choices[0].message.content.strip()
