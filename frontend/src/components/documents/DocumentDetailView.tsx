import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import { AppShell } from "../layout/AppShell";
import { Badge } from "../ui/Badge";
import { Spinner } from "../ui/Spinner";
import { EmptyState } from "../ui/EmptyState";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { TrashIcon } from "../ui/icons";
import { DocumentMenu } from "./DocumentMenu";
import { FigureModal } from "./FigureModal";
import type { DocumentDetail, Group } from "../../types";
import {
  deleteDocument,
  duplicateDocument,
  fetchDocumentDetail,
  fetchGroups,
  getDocumentDownloadUrl,
  updateDocumentCategory,
  updateDocumentName,
} from "../../api/client";
import { injectFigureLinks, stripMarkdown, truncateMarkdownBlocks, truncateText } from "../../lib/markdown";
import "./DocumentDetailView.css";

const STATUS_LABEL: Record<DocumentDetail["status"], string> = {
  indexed: "Indexed",
  processing: "Processing",
  error: "Error",
};

const STATUS_TONE: Record<DocumentDetail["status"], "blue" | "yellow" | "red"> = {
  indexed: "blue",
  processing: "yellow",
  error: "red",
};

const MARKDOWN_PREVIEW_BLOCKS = 6;
const CAPTION_PREVIEW_LENGTH = 110;

export function DocumentDetailView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [document, setDocument] = useState<DocumentDetail | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMarkdownExpanded, setIsMarkdownExpanded] = useState(false);
  const [figureIndex, setFigureIndex] = useState<number | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    fetchDocumentDetail(id)
      .then(setDocument)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load document"))
      .finally(() => setIsLoading(false));
    fetchGroups().then(setGroups);
  }, [id]);

  async function handleChangeCategory(newCategory: string) {
    if (!document) return;
    const updated = await updateDocumentCategory(document.id, newCategory);
    setDocument({ ...document, category: updated.category });
  }

  async function handleRename(name: string) {
    if (!document) return;
    const updated = await updateDocumentName(document.id, name);
    setDocument({ ...document, name: updated.name });
  }

  async function handleDuplicate(targetCategory: string) {
    if (!document) return;
    const duplicate = await duplicateDocument(document.id, targetCategory);
    navigate(`/documents/${duplicate.id}`);
  }

  const linkedMarkdown = useMemo(() => {
    if (!document?.markdown) return "";
    return injectFigureLinks(document.markdown, document.images.length);
  }, [document]);

  const { preview: markdownPreview, isTruncated } = useMemo(
    () => truncateMarkdownBlocks(linkedMarkdown, MARKDOWN_PREVIEW_BLOCKS),
    [linkedMarkdown],
  );

  const markdownComponents: Components = useMemo(
    () => ({
      a({ href, children }) {
        if (href?.startsWith("figure:")) {
          const index = Number(href.slice("figure:".length));
          return (
            <button className="doc-detail__figure-link" onClick={() => setFigureIndex(index)}>
              {children}
            </button>
          );
        }
        return (
          <a href={href} target="_blank" rel="noreferrer">
            {children}
          </a>
        );
      },
    }),
    [],
  );

  async function handleConfirmDelete() {
    if (!document) return;
    setShowDeleteConfirm(false);
    await deleteDocument(document.id);
    navigate("/documents");
  }

  function handleDownloadMarkdown() {
    if (!document?.markdown) return;
    const blob = new Blob([document.markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const link = window.document.createElement("a");
    link.href = url;
    link.download = `${document.name.replace(/\.[^.]+$/, "")}.md`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <AppShell>
      <div className="doc-detail">
        <button className="doc-detail__back" onClick={() => navigate("/documents")}>
          &larr; Back to documents
        </button>

        {isLoading ? (
          <div className="doc-detail__loading">
            <Spinner />
          </div>
        ) : error || !document ? (
          <EmptyState title="Couldn't load this document" description={error ?? "Document not found."} />
        ) : (
          <>
            <header className="doc-detail__header">
              <div>
                <h1 className="doc-detail__name">{document.name}</h1>
                <div className="doc-detail__meta">
                  <span>{document.category}</span>
                  <span aria-hidden="true">·</span>
                  <span>{document.pages} pages</span>
                  <span aria-hidden="true">·</span>
                  <span>{document.sizeMb} MB</span>
                  <span aria-hidden="true">·</span>
                  <Badge tone={STATUS_TONE[document.status]}>{STATUS_LABEL[document.status]}</Badge>
                </div>
              </div>
              <div className="doc-detail__actions">
                <a
                  className="btn btn--primary btn--md"
                  href={getDocumentDownloadUrl(document.id)}
                  download
                >
                  Download original file
                </a>
                {document.markdown && (
                  <button className="btn btn--secondary btn--md" onClick={handleDownloadMarkdown}>
                    Download markdown
                  </button>
                )}
                <button
                  className="btn btn--secondary btn--md doc-detail__delete"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  <TrashIcon />
                  Delete
                </button>
                <DocumentMenu
                  document={document}
                  groups={groups}
                  onRename={handleRename}
                  onMove={handleChangeCategory}
                  onDuplicate={handleDuplicate}
                />
              </div>
            </header>

            {document.images.length > 0 && (
              <section className="doc-detail__section">
                <h2>Extracted figures</h2>
                <div className="doc-detail__images">
                  {document.images.map((image, index) => (
                    <button
                      className="doc-detail__image-card"
                      key={image.filename}
                      onClick={() => setFigureIndex(index)}
                    >
                      <span className="doc-detail__image-frame">
                        <img src={image.url} alt={`Figure ${index + 1}`} />
                      </span>
                      <span className="doc-detail__image-caption">
                        {image.page !== null && <span className="doc-detail__image-page">p. {image.page} · </span>}
                        {truncateText(stripMarkdown(image.caption), CAPTION_PREVIEW_LENGTH)}
                      </span>
                    </button>
                  ))}
                </div>
              </section>
            )}

            <section className="doc-detail__section">
              <h2>Document content</h2>
              {document.markdown ? (
                <>
                  <div className="doc-detail__markdown">
                    <ReactMarkdown components={markdownComponents}>
                      {isMarkdownExpanded ? linkedMarkdown : markdownPreview}
                    </ReactMarkdown>
                  </div>
                  {isTruncated && (
                    <button
                      className="btn btn--tertiary btn--md doc-detail__show-more"
                      onClick={() => setIsMarkdownExpanded((prev) => !prev)}
                    >
                      {isMarkdownExpanded ? "Show less" : "Show more"}
                    </button>
                  )}
                </>
              ) : (
                <p className="doc-detail__no-content">
                  No extracted content available for this document yet.
                </p>
              )}
            </section>
          </>
        )}
      </div>

      {document && figureIndex !== null && (
        <FigureModal
          images={document.images}
          index={figureIndex}
          onClose={() => setFigureIndex(null)}
          onNavigate={setFigureIndex}
        />
      )}

      {document && showDeleteConfirm && (
        <ConfirmDialog
          title="Delete document"
          message={`Delete "${document.name}"? This cannot be undone.`}
          confirmLabel="Delete"
          onConfirm={handleConfirmDelete}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
    </AppShell>
  );
}
