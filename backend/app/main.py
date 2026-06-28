from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api import routes_chat, routes_documents, routes_groups
from app.config import settings
from app.database import init_db
from app.services.ingestion_queue import start_worker
from app.storage.paths import ensure_data_dirs, images_dir

app = FastAPI(title="Multimodal RAG Assistant API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(routes_documents.router)
app.include_router(routes_groups.router)
app.include_router(routes_chat.router)


@app.on_event("startup")
def on_startup() -> None:
    ensure_data_dirs()
    init_db()
    app.mount("/static/images", StaticFiles(directory=str(images_dir())), name="images")
    start_worker()
