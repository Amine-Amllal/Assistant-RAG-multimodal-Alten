import base64
import io
from functools import lru_cache

import numpy as np
from huggingface_hub import InferenceClient
from PIL import Image

from app.config import settings

CAPTION_PROMPT = (
    "Describe this image in detail. It is a figure extracted from a technical document "
    "(research paper or technical manual). Explain what it shows, including any architecture, "
    "diagram, chart, or text visible in it."
)


@lru_cache
def _client() -> InferenceClient:
    return InferenceClient(token=settings.HF_TOKEN, provider=settings.HF_INFERENCE_PROVIDER)


def embed_texts(texts: list[str]) -> list[list[float]]:
    if not texts:
        return []
    client = _client()
    embeddings: list[list[float]] = []
    for text in texts:
        vector = client.feature_extraction(text, model=settings.HF_EMBEDDING_MODEL)
        embeddings.append(_flatten_vector(vector))
    return embeddings


def caption_image(image: Image.Image) -> str:
    client = _client()
    data_url = _image_to_data_url(image)
    response = client.chat_completion(
        model=settings.HF_VLM_MODEL,
        messages=[
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": CAPTION_PROMPT},
                    {"type": "image_url", "image_url": {"url": data_url}},
                ],
            }
        ],
        max_tokens=300,
    )
    return response.choices[0].message.content.strip()


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
