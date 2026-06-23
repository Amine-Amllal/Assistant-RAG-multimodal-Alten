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


def update_pages(document_id: str, pages: int) -> None:
    with get_connection() as conn:
        conn.execute("UPDATE documents SET pages = ? WHERE id = ?", (pages, document_id))


def update_status(document_id: str, status: str, error_message: str | None = None) -> None:
    with get_connection() as conn:
        conn.execute(
            "UPDATE documents SET status = ?, error_message = ? WHERE id = ?",
            (status, error_message, document_id),
        )


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
    )
