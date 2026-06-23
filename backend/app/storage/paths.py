from pathlib import Path

from app.config import settings


def uploads_dir() -> Path:
    return settings.data_dir / "uploads"


def images_dir() -> Path:
    return settings.data_dir / "images"


def chroma_dir() -> Path:
    return settings.data_dir / "chroma"


def sqlite_path() -> Path:
    return settings.data_dir / "app.db"


def ensure_data_dirs() -> None:
    for d in (uploads_dir(), images_dir(), chroma_dir()):
        d.mkdir(parents=True, exist_ok=True)
