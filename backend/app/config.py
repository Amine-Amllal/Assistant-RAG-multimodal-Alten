from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    HF_TOKEN: str = ""
    HF_EMBEDDING_MODEL: str = "intfloat/multilingual-e5-large"
    HF_VLM_MODEL: str = "Qwen/Qwen2-VL-7B-Instruct"
    HF_INFERENCE_PROVIDER: str = "hf-inference"

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
