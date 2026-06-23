from datetime import date
from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, BackgroundTasks, HTTPException, UploadFile

from app.models.schemas import DocumentItem
from app.services import documents_repo
from app.services.ingestion import run_ingestion
from app.storage.paths import uploads_dir

router = APIRouter()

ALLOWED_EXTENSIONS = {".pdf", ".doc", ".docx"}
DEFAULT_CATEGORY = "Technical Manual"
DEFAULT_THUMBNAIL_COLOR = "blue"


@router.get("/api/documents", response_model=list[DocumentItem])
def get_documents() -> list[DocumentItem]:
    return documents_repo.list_documents()


@router.post("/api/documents/upload", response_model=DocumentItem)
async def upload_document(file: UploadFile, background_tasks: BackgroundTasks) -> DocumentItem:
    extension = Path(file.filename or "").suffix.lower()
    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"Unsupported file type: {extension or 'unknown'}")

    contents = await file.read()
    document_id = str(uuid4())
    stored_path = uploads_dir() / f"{document_id}_{file.filename}"
    stored_path.write_bytes(contents)

    size_mb = round(len(contents) / (1024 * 1024), 1)
    document = documents_repo.insert_document(
        id=document_id,
        name=file.filename or document_id,
        category=DEFAULT_CATEGORY,
        size_mb=size_mb,
        uploaded_at=date.today().isoformat(),
        thumbnail_color=DEFAULT_THUMBNAIL_COLOR,
        file_path=str(stored_path),
    )

    background_tasks.add_task(run_ingestion, document_id, document.name, stored_path)
    return document
