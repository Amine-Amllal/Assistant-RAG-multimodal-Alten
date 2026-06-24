import base64
import io
from functools import lru_cache

import numpy as np
from huggingface_hub import InferenceClient
from huggingface_hub.errors import HfHubHTTPError
from PIL import Image
from tenacity import retry, retry_if_exception, stop_after_attempt, wait_random_exponential

from app.config import settings


def _is_transient_hf_error(exc: BaseException) -> bool:
    # HF's serverless Inference Providers occasionally return a 5xx on cold-start or
    # under load for an otherwise-valid request; retrying a couple of times clears it
    # up without failing the whole document. 4xx (bad model/auth/payload) won't be
    # fixed by retrying, so don't burn time on those.
    return isinstance(exc, HfHubHTTPError) and exc.response.status_code >= 500


_retry_transient_hf_error = retry(
    retry=retry_if_exception(_is_transient_hf_error),
    stop=stop_after_attempt(3),
    wait=wait_random_exponential(multiplier=1, max=10),
    reraise=True,
)

CAPTION_PROMPT_TEMPLATE = """You are writing the description of a figure for a knowledge base that end users \
will read directly and that will be used to retrieve this figure when they ask questions about it.

Output ONLY the description itself. Do not include any preamble, meta-commentary, or sign-off \
(e.g. "Here's a detailed description", "Overall Description:", "I hope this helps"). Do not hedge \
with words like "likely" or "probably" about facts already given to you in the context below — state \
them directly. Only hedge about details that are genuinely not inferable from the image or the context.

Document context (use this to ground your description, not to guess):
- Document: {document_name}
{figure_caption_line}
Describe what the figure shows: its type (architecture diagram, flowchart, chart, table, photo, etc.), \
its components, the relationships or flow between them, and any text, labels, or values visible in it. \
Be concrete and specific."""


@lru_cache
def _embedding_client() -> InferenceClient:
    return InferenceClient(token=settings.HF_TOKEN, provider=settings.HF_EMBEDDING_PROVIDER)


@lru_cache
def _vlm_client() -> InferenceClient:
    return InferenceClient(token=settings.HF_TOKEN, provider=settings.HF_VLM_PROVIDER)


def embed_texts(texts: list[str]) -> list[list[float]]:
    if not texts:
        return []
    client = _embedding_client()
    embeddings: list[list[float]] = []
    for text in texts:
        vector = _embed_one(client, text)
        embeddings.append(_flatten_vector(vector))
    return embeddings


@_retry_transient_hf_error
def _embed_one(client: InferenceClient, text: str):
    return client.feature_extraction(text, model=settings.HF_EMBEDDING_MODEL, truncate=True)


def caption_image(image: Image.Image, *, document_name: str, figure_caption: str | None = None) -> str:
    client = _vlm_client()
    data_url = _image_to_data_url(image)
    figure_caption_line = f"- Figure caption (from the document): {figure_caption}\n" if figure_caption else ""
    prompt = CAPTION_PROMPT_TEMPLATE.format(document_name=document_name, figure_caption_line=figure_caption_line)
    response = _caption_one(client, prompt, data_url)
    return response.choices[0].message.content.strip()


@_retry_transient_hf_error
def _caption_one(client: InferenceClient, prompt: str, data_url: str):
    return client.chat_completion(
        model=settings.HF_VLM_MODEL,
        messages=[
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": prompt},
                    {"type": "image_url", "image_url": {"url": data_url}},
                ],
            }
        ],
        max_tokens=300,
    )


def _image_to_data_url(image: Image.Image) -> str:
    buffer = io.BytesIO()
    image.save(buffer, format="PNG")
    encoded = base64.b64encode(buffer.getvalue()).decode("utf-8")
    return f"data:image/png;base64,{encoded}"


def _flatten_vector(vector) -> list[float]:
    # feature_extraction returns a numpy ndarray; it can be 1D (already a single
    # sentence-level vector) or 2D (per-token embeddings) depending on the model,
    # so mean-pool over the token axis when needed.
    array = np.asarray(vector)
    if array.ndim == 2:
        array = array.mean(axis=0)
    return array.astype(float).tolist()
