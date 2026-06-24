import os
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    HF_TOKEN: str = ""
    HF_EMBEDDING_MODEL: str = "intfloat/multilingual-e5-large"
    # Provider serving HF_EMBEDDING_MODEL for the "feature-extraction" task.
    HF_EMBEDDING_PROVIDER: str = "hf-inference"
    HF_VLM_MODEL: str = "google/gemma-3-27b-it"
    # Provider serving HF_VLM_MODEL for the "conversational" task (image captioning).
    # Kept separate from HF_EMBEDDING_PROVIDER: the two models are rarely served by the
    # same provider, and chat_completion()/feature_extraction() each require a provider
    # that supports their specific task.
    HF_VLM_PROVIDER: str = "deepinfra"

    MISTRAL_API_KEY: str = ""
    MISTRAL_MODEL: str = "mistral-small-latest"

    CHROMA_COLLECTION_NAME: str = "documents"
    RAG_TOP_K: int = 5

    DATA_DIR: str = "./data"

    # Optional local folder (produced by `docling-tools models download layout tableformer -o <dir>`)
    # containing Docling's model weights. When set, Docling loads from here instead of trying to
    # download from Hugging Face — needed on networks that block HF's storage CDN.
    DOCLING_ARTIFACTS_PATH: str = ""

    CORS_ALLOWED_ORIGINS: str = "http://localhost:5173"

    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.CORS_ALLOWED_ORIGINS.split(",") if origin.strip()]

    @property
    def data_dir(self) -> Path:
        return Path(self.DATA_DIR).resolve()


settings = Settings()

# huggingface_hub (used directly by Docling's model downloader, not just our own
# InferenceClient calls) reads the HF_TOKEN process environment variable itself —
# it has no visibility into pydantic-settings' parsed .env values. Export it so
# Docling's internal downloads are authenticated too.
if settings.HF_TOKEN:
    os.environ.setdefault("HF_TOKEN", settings.HF_TOKEN)
