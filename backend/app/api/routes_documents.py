import shutil
from datetime import datetime, timezone
from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Form, HTTPException, Request, UploadFile
from fastapi.responses import FileResponse, Response

from app.models.schemas import (
    DocumentCategoryUpdate,
    DocumentDetail,
    DocumentDuplicateRequest,
    DocumentImage,
    DocumentItem,
    DocumentNameUpdate,
)
from app.services import documents_repo, groups_repo, vector_store
from app.services.ingestion_queue import enqueue
from app.storage.paths import images_dir, markdown_dir, uploads_dir

router = APIRouter()

ALLOWED_EXTENSIONS = {".pdf", ".doc", ".docx"}
DEFAULT_THUMBNAIL_COLOR = "blue"


@router.get("/api/documents", response_model=list[DocumentItem])
def get_documents() -> list[DocumentItem]:
    return documents_repo.list_documents()


@router.get("/api/documents/{document_id}", response_model=DocumentDetail)
def get_document_detail(document_id: str, request: Request) -> DocumentDetail:
    document = documents_repo.get_document(document_id)
    row = documents_repo.get_document_row(document_id)
    if document is None or row is None:
        raise HTTPException(status_code=404, detail="Document not found")

    # Duplicates don't store their own markdown/images/vectors — they resolve to
    # whichever document actually holds the (singly-stored) processed content.
    content_id = row["source_document_id"] or document_id

    markdown_path = markdown_dir() / f"{content_id}.md"
    markdown = markdown_path.read_text(encoding="utf-8") if markdown_path.exists() else None

    base_url = str(request.base_url).rstrip("/")
    images = [
        DocumentImage(
            filename=Path(chunk.image_path).name,
            page=chunk.page,
            caption=chunk.text,
            url=f"{base_url}/static/images/{chunk.image_path}",
        )
        for chunk in vector_store.get_image_chunks(content_id)
    ]

    return DocumentDetail(**document.model_dump(), markdown=markdown, images=images)


@router.get("/api/documents/{document_id}/download")
def download_document(document_id: str) -> FileResponse:
    row = documents_repo.get_document_row(document_id)
    if row is None:
        raise HTTPException(status_code=404, detail="Document not found")

    file_path = Path(row["file_path"])
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found on disk")

    return FileResponse(path=file_path, filename=row["name"], media_type="application/octet-stream")


@router.delete("/api/documents/{document_id}", status_code=204)
def delete_document(document_id: str) -> Response:
    row = documents_repo.get_document_row(document_id)
    if row is None:
        raise HTTPException(status_code=404, detail="Document not found")

    # Duplicates share their root document's file/markdown/vectors — only the root
    # actually owns that content, so only deleting the root should remove it.
    # documents_repo.delete_document cascades the DB rows either way.
    if row["source_document_id"] is None:
        vector_store.delete_document(document_id)

        file_path = Path(row["file_path"])
        file_path.unlink(missing_ok=True)

        markdown_path = markdown_dir() / f"{document_id}.md"
        markdown_path.unlink(missing_ok=True)

        doc_images_dir = images_dir() / document_id
        shutil.rmtree(doc_images_dir, ignore_errors=True)

    documents_repo.delete_document(document_id)
    return Response(status_code=204)


@router.patch("/api/documents/{document_id}/category", response_model=DocumentItem)
def update_document_category(document_id: str, payload: DocumentCategoryUpdate) -> DocumentItem:
    document = documents_repo.get_document(document_id)
    if document is None:
        raise HTTPException(status_code=404, detail="Document not found")

    valid_names = {group.name for group in groups_repo.list_groups()}
    if payload.category not in valid_names:
        raise HTTPException(status_code=400, detail=f'Unknown group "{payload.category}"')

    documents_repo.update_category(document_id, payload.category)
    document.category = payload.category
    return document


@router.patch("/api/documents/{document_id}/name", response_model=DocumentItem)
def update_document_name(document_id: str, payload: DocumentNameUpdate) -> DocumentItem:
    document = documents_repo.get_document(document_id)
    if document is None:
        raise HTTPException(status_code=404, detail="Document not found")

    name = payload.name.strip()
    if not name:
        raise HTTPException(status_code=400, detail="Document name cannot be empty")

    documents_repo.update_name(document_id, name)
    document.name = name
    return document


@router.post("/api/documents/{document_id}/duplicate", response_model=DocumentItem, status_code=201)
def duplicate_document(document_id: str, payload: DocumentDuplicateRequest) -> DocumentItem:
    document = documents_repo.get_document(document_id)
    if document is None:
        raise HTTPException(status_code=404, detail="Document not found")
    if document.status != "indexed":
        raise HTTPException(status_code=400, detail="Only fully indexed documents can be duplicated")

    valid_names = {group.name for group in groups_repo.list_groups()}
    if payload.category not in valid_names:
        raise HTTPException(status_code=400, detail=f'Unknown group "{payload.category}"')

    return documents_repo.duplicate_document(
        document_id,
        new_id=str(uuid4()),
        category=payload.category,
        uploaded_at=datetime.now(timezone.utc).isoformat(),
    )


@router.post("/api/documents/upload", response_model=DocumentItem)
async def upload_document(file: UploadFile, category: str | None = Form(default=None)) -> DocumentItem:
    extension = Path(file.filename or "").suffix.lower()
    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"Unsupported file type: {extension or 'unknown'}")

    valid_names = {group.name for group in groups_repo.list_groups()}
    resolved_category = category if category in valid_names else groups_repo.get_default_group_name()

    contents = await file.read()
    document_id = str(uuid4())
    stored_path = uploads_dir() / f"{document_id}_{file.filename}"
    stored_path.write_bytes(contents)

    size_mb = round(len(contents) / (1024 * 1024), 1)
    document = documents_repo.insert_document(
        id=document_id,
        name=file.filename or document_id,
        category=resolved_category,
        size_mb=size_mb,
        uploaded_at=datetime.now(timezone.utc).isoformat(),
        thumbnail_color=DEFAULT_THUMBNAIL_COLOR,
        file_path=str(stored_path),
    )

    enqueue(document_id, document.name, stored_path)
    return document
