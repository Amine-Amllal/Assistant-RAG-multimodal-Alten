from app.database import get_connection
from app.models.schemas import DocumentItem


def insert_document(
    *,
    id: str,
    name: str,
    category: str,
    size_mb: float,
    uploaded_at: str,
    thumbnail_color: str,
    file_path: str,
) -> DocumentItem:
    with get_connection() as conn:
        conn.execute(
            """
            INSERT INTO documents (id, name, category, pages, size_mb, status, uploaded_at, thumbnail_color, file_path)
            VALUES (?, ?, ?, 0, ?, 'processing', ?, ?, ?)
            """,
            (id, name, category, size_mb, uploaded_at, thumbnail_color, file_path),
        )
    return DocumentItem(
        id=id,
        name=name,
        category=category,
        pages=0,
        sizeMb=size_mb,
        status="processing",
        uploadedAt=uploaded_at,
        thumbnailColor=thumbnail_color,
    )


def list_documents() -> list[DocumentItem]:
    with get_connection() as conn:
        rows = conn.execute("SELECT * FROM documents ORDER BY uploaded_at DESC").fetchall()
    return [_row_to_item(row) for row in rows]


def get_document_row(document_id: str):
    with get_connection() as conn:
        return conn.execute("SELECT * FROM documents WHERE id = ?", (document_id,)).fetchone()


def get_document(document_id: str) -> DocumentItem | None:
    row = get_document_row(document_id)
    return _row_to_item(row) if row is not None else None


def get_duplicate_ids(document_id: str) -> list[str]:
    with get_connection() as conn:
        rows = conn.execute("SELECT id FROM documents WHERE source_document_id = ?", (document_id,)).fetchall()
    return [row["id"] for row in rows]


def delete_document(document_id: str) -> None:
    with get_connection() as conn:
        # Cascade: a "root" document's file/markdown/vectors are shared by its
        # duplicates, so removing it must take its duplicates' DB rows with it too
        # (their content would otherwise point at data that no longer exists).
        conn.execute("DELETE FROM documents WHERE id = ? OR source_document_id = ?", (document_id, document_id))


def duplicate_document(document_id: str, *, new_id: str, category: str, uploaded_at: str) -> DocumentItem:
    row = get_document_row(document_id)
    if row is None:
        raise ValueError(f"Document not found: {document_id}")

    # Flatten to the root id so a duplicate-of-a-duplicate doesn't chain — every
    # duplicate's content always resolves directly to the one real document.
    root_id = row["source_document_id"] or row["id"]

    with get_connection() as conn:
        conn.execute(
            """
            INSERT INTO documents
                (id, name, category, pages, size_mb, status, uploaded_at, thumbnail_color, file_path, source_document_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                new_id,
                row["name"],
                category,
                row["pages"],
                row["size_mb"],
                row["status"],
                uploaded_at,
                row["thumbnail_color"],
                row["file_path"],
                root_id,
            ),
        )
    return DocumentItem(
        id=new_id,
        name=row["name"],
        category=category,
        pages=row["pages"],
        sizeMb=row["size_mb"],
        status=row["status"],
        uploadedAt=uploaded_at,
        thumbnailColor=row["thumbnail_color"],
    )


def update_pages(document_id: str, pages: int) -> None:
    with get_connection() as conn:
        conn.execute("UPDATE documents SET pages = ? WHERE id = ?", (pages, document_id))


def update_status(document_id: str, status: str, error_message: str | None = None) -> None:
    with get_connection() as conn:
        conn.execute(
            "UPDATE documents SET status = ?, error_message = ?, processing_step = NULL WHERE id = ?",
            (status, error_message, document_id),
        )


def update_processing_step(document_id: str, step: str) -> None:
    with get_connection() as conn:
        conn.execute("UPDATE documents SET processing_step = ? WHERE id = ?", (step, document_id))


def update_category(document_id: str, category: str) -> None:
    with get_connection() as conn:
        conn.execute("UPDATE documents SET category = ? WHERE id = ?", (category, document_id))


def update_name(document_id: str, name: str) -> None:
    with get_connection() as conn:
        conn.execute("UPDATE documents SET name = ? WHERE id = ?", (name, document_id))


def _row_to_item(row) -> DocumentItem:
    return DocumentItem(
        id=row["id"],
        name=row["name"],
        category=row["category"],
        pages=row["pages"],
        sizeMb=row["size_mb"],
        status=row["status"],
        uploadedAt=row["uploaded_at"],
        thumbnailColor=row["thumbnail_color"],
        processingStep=row["processing_step"],
    )
