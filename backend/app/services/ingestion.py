from dataclasses import dataclass
from pathlib import Path

from app.services import documents_repo, hf_client, vector_store
from app.services.docling_parser import chunk_document, export_markdown, extract_images, parse_document
from app.storage.paths import images_dir, markdown_dir


@dataclass
class CaptionedImage:
    page: int | None
    filename: str
    caption: str


def run_ingestion(document_id: str, document_name: str, file_path: Path) -> None:
    try:
        documents_repo.update_processing_step(document_id, "Parsing document...")
        docling_doc = parse_document(file_path)
        documents_repo.update_pages(document_id, len(docling_doc.pages))

        documents_repo.update_processing_step(document_id, "Exporting document content...")
        markdown_path = markdown_dir() / f"{document_id}.md"
        markdown_path.write_text(export_markdown(docling_doc), encoding="utf-8")

        documents_repo.update_processing_step(document_id, "Splitting text into chunks...")
        text_chunks = chunk_document(docling_doc)

        captioned_images = _caption_images(document_id, document_name, docling_doc)

        documents_repo.update_processing_step(document_id, "Generating text embeddings...")
        text_embeddings = hf_client.embed_texts([c.text for c in text_chunks])

        documents_repo.update_processing_step(document_id, "Generating figure embeddings...")
        caption_embeddings = hf_client.embed_texts([img.caption for img in captioned_images])

        documents_repo.update_processing_step(document_id, "Indexing into the vector store...")
        vector_store.upsert_text_chunks(document_id, document_name, text_chunks, text_embeddings)
        vector_store.upsert_image_chunks(document_id, document_name, captioned_images, caption_embeddings)

        documents_repo.update_status(document_id, "indexed")
    except Exception as e:
        documents_repo.update_status(document_id, "error", error_message=str(e))


def _caption_images(document_id: str, document_name: str, docling_doc) -> list[CaptionedImage]:
    image_records = extract_images(docling_doc)
    if not image_records:
        return []

    doc_images_dir = images_dir() / document_id
    doc_images_dir.mkdir(parents=True, exist_ok=True)

    captioned: list[CaptionedImage] = []
    for i, record in enumerate(image_records):
        documents_repo.update_processing_step(
            document_id, f"Describing figure {i + 1} of {len(image_records)}..."
        )
        filename = f"picture_{i}.png"
        record.image.save(doc_images_dir / filename)
        caption = hf_client.caption_image(record.image, document_name=document_name, figure_caption=record.caption)
        captioned.append(CaptionedImage(page=record.page, filename=filename, caption=caption))
    return captioned
