import os
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    HF_TOKEN: str = ""
    HF_EMBEDDING_MODEL: str = "intfloat/multilingual-e5-large"
    # Provider serving HF_EMBEDDING_MODEL for the "feature-extraction" task.
    HF_EMBEDDING_PROVIDER: str = "hf-inference"
    # Where text embeddings are computed:
    #   "hf_inference" -> Hugging Face Inference API (needs reachable HF domains).
    #   "local"        -> load HF_EMBEDDING_MODEL weights from LOCAL_EMBEDDING_MODEL_PATH and
    #                     run them on-device via transformers, with NO network.
    #   "mistral"      -> Mistral's mistral-embed over the Mistral API (reachable through
    #                     Zscaler, unlike Hugging Face). This is the active backend here.
    # IMPORTANT: "mistral" produces a DIFFERENT vector space than the e5-large backends, so
    # switching to/from it requires wiping the Chroma collection and re-ingesting. Both are
    # 1024-dim, so Chroma will NOT error on a mismatch — it just returns garbage similarities.
    EMBEDDING_BACKEND: str = "hf_inference"
    # Folder holding the local embedding model (config.json, model.safetensors, tokenizer files).
    # Produce it on an unrestricted machine with:
    #   huggingface-cli download intfloat/multilingual-e5-large --local-dir <dir>
    # then copy <dir> here. Only used when EMBEDDING_BACKEND="local".
    LOCAL_EMBEDDING_MODEL_PATH: str = ""
    HF_VLM_MODEL: str = "google/gemma-3-27b-it"
    # Provider serving HF_VLM_MODEL for the "conversational" task (image captioning).
    # Kept separate from HF_EMBEDDING_PROVIDER: the two models are rarely served by the
    # same provider, and chat_completion()/feature_extraction() each require a provider
    # that supports their specific task.
    HF_VLM_PROVIDER: str = "deepinfra"

    MISTRAL_API_KEY: str = ""
    MISTRAL_MODEL: str = "mistral-small-latest"

    GROQ_API_KEY: str = ""
    # Embedding model used when EMBEDDING_BACKEND="mistral" (1024-dim).
    MISTRAL_EMBED_MODEL: str = "mistral-embed"

    CHROMA_COLLECTION_NAME: str = "documents"
    RAG_TOP_K: int = 5

    DATA_DIR: str = "./data"

    # Optional local folder (produced by `docling-tools models download layout tableformer -o <dir>`)
    # containing Docling's model weights. When set, Docling loads from here instead of trying to
    # download from Hugging Face — needed on networks that block HF's storage CDN.
    DOCLING_ARTIFACTS_PATH: str = ""

    CORS_ALLOWED_ORIGINS: str = "http://localhost:5173"

    # Clerk (auth). The publishable key encodes the Clerk Frontend API domain, used to
    # verify session tokens against Clerk's JWKS endpoint (see app/services/clerk_auth.py).
    CLERK_PUBLISHABLE_KEY: str = ""
    CLERK_SECRET_KEY: str = ""

    # Redis cache for conversation reads (see app/services/cache.py).
    #   "memory://"        -> in-process fakeredis, no server needed (default, good for local dev)
    #   "redis://host:6379/0" -> a real Redis server (e.g. OCI Cache in the deployed env)
    #   ""                 -> caching disabled entirely
    REDIS_URL: str = "memory://"
    REDIS_TTL_SECONDS: int = 300

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
