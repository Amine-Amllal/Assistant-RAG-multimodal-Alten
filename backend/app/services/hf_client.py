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
    if settings.EMBEDDING_BACKEND == "mistral":
        # Imported lazily to avoid a circular import (mistral_client imports vector_store).
        from app.services import mistral_client

        return mistral_client.embed_texts(texts)
    if settings.EMBEDDING_BACKEND == "local":
        return _embed_texts_local(texts)
    client = _embedding_client()
    embeddings: list[list[float]] = []
    for text in texts:
        vector = _embed_one(client, text)
        embeddings.append(_flatten_vector(vector))
    return embeddings


@_retry_transient_hf_error
def _embed_one(client: InferenceClient, text: str):
    return client.feature_extraction(text, model=settings.HF_EMBEDDING_MODEL, truncate=True)


@lru_cache
def _local_embedding_model():
    # Imported lazily so the HF-Inference path doesn't pay torch/transformers import cost.
    import torch  # noqa: F401  (ensures a clear error here if torch is missing)
    from transformers import AutoModel, AutoTokenizer

    from pathlib import Path

    path = settings.LOCAL_EMBEDDING_MODEL_PATH or settings.HF_EMBEDDING_MODEL
    # A configured folder that isn't there yet is the common setup mistake; surface it plainly
    # instead of transformers' confusing "Repo id must use alphanumeric chars" (it falls back to
    # treating a missing local path as a Hub repo id).
    if settings.LOCAL_EMBEDDING_MODEL_PATH and not Path(path).is_dir():
        raise FileNotFoundError(
            f"EMBEDDING_BACKEND=local but no model folder at '{Path(path).resolve()}'. "
            f"Download it on an unrestricted machine with: "
            f"huggingface-cli download {settings.HF_EMBEDDING_MODEL} --local-dir <dir>, "
            f"then copy <dir> here and point LOCAL_EMBEDDING_MODEL_PATH at it."
        )
    # local_files_only=True: never reach for the network — on a blocked network a download
    # attempt would hang/fail instead of erroring clearly that the weights aren't present.
    tokenizer = AutoTokenizer.from_pretrained(path, local_files_only=True)
    # .float() upcasts to fp32 regardless of how the weights were saved: the offline copy is
    # stored in fp16 to fit under GitHub's 2 GB release-asset limit, but CPU inference wants
    # fp32 (many fp16 ops are unsupported/slow on CPU). The precision round-trip is negligible
    # for retrieval ranking.
    model = AutoModel.from_pretrained(path, local_files_only=True).float()
    model.eval()
    return tokenizer, model


def _embed_texts_local(texts: list[str]) -> list[list[float]]:
    import torch

    tokenizer, model = _local_embedding_model()
    embeddings: list[list[float]] = []
    # Batch to keep memory bounded on CPU; e5-large is ~560M params.
    batch_size = 16
    for start in range(0, len(texts), batch_size):
        batch = texts[start : start + batch_size]
        encoded = tokenizer(
            batch, padding=True, truncation=True, max_length=512, return_tensors="pt"
        )
        with torch.no_grad():
            output = model(**encoded)
        # e5 pools by masked mean over tokens, then L2-normalizes — the same recipe HF's
        # serverless endpoint (TEI) used, so these vectors match the existing Chroma index
        # (stored vectors have norm 1.0). No "query:"/"passage:" prefix, to stay identical
        # to how the corpus was originally ingested (raw text, no prefix).
        mask = encoded["attention_mask"].unsqueeze(-1).float()
        pooled = (output.last_hidden_state * mask).sum(dim=1) / mask.sum(dim=1).clamp(min=1e-9)
        normalized = torch.nn.functional.normalize(pooled, p=2, dim=1)
        embeddings.extend(normalized.cpu().tolist())
    return embeddings


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
