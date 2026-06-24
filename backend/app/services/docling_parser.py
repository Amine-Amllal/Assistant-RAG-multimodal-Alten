from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path

from docling.backend.pypdfium2_backend import PyPdfiumDocumentBackend
from docling.datamodel.base_models import ConversionStatus, InputFormat
from docling.datamodel.pipeline_options import PdfPipelineOptions
from docling.document_converter import DocumentConverter, PdfFormatOption

from app.config import settings


@dataclass
class ChunkRecord:
    text: str
    page: int | None


@dataclass
class ImageRecord:
    page: int | None
    image: object  # PIL.Image.Image
    caption: str | None  # caption text Docling found near the figure in the source document, if any


@lru_cache
def _build_converter() -> DocumentConverter:
    pdf_pipeline_options = PdfPipelineOptions()
    pdf_pipeline_options.do_ocr = False  # OCR out of scope for this iteration
    pdf_pipeline_options.generate_picture_images = True
    if settings.DOCLING_ARTIFACTS_PATH:
        # Load model weights from a local folder instead of downloading from HF.
        # Produced via: docling-tools models download layout tableformer -o <dir>
        pdf_pipeline_options.artifacts_path = settings.DOCLING_ARTIFACTS_PATH
    return DocumentConverter(
        format_options={
            InputFormat.PDF: PdfFormatOption(
                pipeline_options=pdf_pipeline_options,
                # The default docling-parse backend hits `std::bad_alloc` on some PDFs
                # (e.g. pages with large/complex embedded images). pypdfium2 is more
                # memory-robust for parsing, at a small cost in layout-extraction fidelity.
                backend=PyPdfiumDocumentBackend,
            )
        }
    )


def parse_document(file_path: Path):
    converter = _build_converter()
    result = converter.convert(str(file_path))
    if result.status != ConversionStatus.SUCCESS:
        raise RuntimeError(f"Docling conversion failed with status: {result.status}")
    return result.document


def export_markdown(docling_doc) -> str:
    return docling_doc.export_to_markdown()


def extract_images(docling_doc) -> list[ImageRecord]:
    records: list[ImageRecord] = []
    for picture in docling_doc.pictures:
        image = picture.get_image(docling_doc)
        if image is None:
            continue
        page_no = picture.prov[0].page_no if picture.prov else None
        caption = picture.caption_text(docling_doc).strip() or None
        records.append(ImageRecord(page=page_no, image=image, caption=caption))
    return records


def chunk_document(docling_doc, max_tokens: int = 512) -> list[ChunkRecord]:
    try:
        return _chunk_with_hybrid_chunker(docling_doc, max_tokens)
    except Exception:
        return _chunk_markdown_fallback(docling_doc)


def _chunk_with_hybrid_chunker(docling_doc, max_tokens: int) -> list[ChunkRecord]:
    from docling_core.transforms.chunker.hybrid_chunker import HybridChunker
    from docling_core.transforms.chunker.tokenizer.huggingface import HuggingFaceTokenizer
    from transformers import AutoTokenizer

    tokenizer = HuggingFaceTokenizer(
        tokenizer=AutoTokenizer.from_pretrained(settings.HF_EMBEDDING_MODEL),
        max_tokens=max_tokens,
    )
    chunker = HybridChunker(tokenizer=tokenizer)

    chunks: list[ChunkRecord] = []
    for chunk in chunker.chunk(docling_doc):
        page_no = _first_page_number(chunk)
        chunks.append(ChunkRecord(text=chunker.contextualize(chunk), page=page_no))
    return chunks


def _first_page_number(chunk) -> int | None:
    for item in getattr(chunk.meta, "doc_items", []) or []:
        prov = getattr(item, "prov", None)
        if prov:
            return prov[0].page_no
    return None


def _chunk_markdown_fallback(docling_doc, chunk_size: int = 1500, overlap: int = 200) -> list[ChunkRecord]:
    markdown = docling_doc.export_to_markdown()
    chunks: list[ChunkRecord] = []
    start = 0
    while start < len(markdown):
        end = start + chunk_size
        chunks.append(ChunkRecord(text=markdown[start:end], page=None))
        start = end - overlap
    return chunks
