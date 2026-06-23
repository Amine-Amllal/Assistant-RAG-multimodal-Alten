from functools import lru_cache

from mistralai.client import Mistral

from app.config import settings
from app.services.vector_store import RetrievedChunk

SYSTEM_PROMPT = (
    "You are a technical assistant answering questions about a corpus of research papers "
    "and technical manuals. Use ONLY the numbered sources below to answer. Cite sources "
    "inline using [Source N]. If the sources do not contain the answer, say so explicitly "
    "instead of guessing."
)


@lru_cache
def _client() -> Mistral:
    return Mistral(api_key=settings.MISTRAL_API_KEY)


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
