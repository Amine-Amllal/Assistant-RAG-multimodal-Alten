import { useState } from "react";
import type { MouseEvent } from "react";
import { useNavigate } from "react-router-dom";
import type { DocumentItem, Group } from "../../types";
import { Badge } from "../ui/Badge";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { Spinner } from "../ui/Spinner";
import { TrashIcon } from "../ui/icons";
import { DocumentMenu } from "./DocumentMenu";
import "./DocumentCard.css";

const STATUS_LABEL: Record<DocumentItem["status"], string> = {
  indexed: "Indexed",
  processing: "Processing",
  error: "Error",
};

const STATUS_TONE: Record<DocumentItem["status"], "blue" | "yellow" | "red"> = {
  indexed: "blue",
  processing: "yellow",
  error: "red",
};

function formatUploadedAt(uploadedAt: string): string {
  const parsed = new Date(uploadedAt);
  if (Number.isNaN(parsed.getTime())) {
    return uploadedAt;
  }
  return parsed.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

interface DocumentCardProps {
  document: DocumentItem;
  groups: Group[];
  onDelete: (id: string) => void;
  onChangeCategory: (id: string, category: string) => Promise<void>;
  onRename: (id: string, name: string) => Promise<void>;
  onDuplicate: (id: string, category: string) => Promise<void>;
}

export function DocumentCard({
  document,
  groups,
  onDelete,
  onChangeCategory,
  onRename,
  onDuplicate,
}: DocumentCardProps) {
  const navigate = useNavigate();
  const isIndexed = document.status === "indexed";
  const [showConfirm, setShowConfirm] = useState(false);

  function handleDeleteClick(event: MouseEvent) {
    event.stopPropagation();
    setShowConfirm(true);
  }

  return (
    <>
      <article
        className={`doc-card${isIndexed ? " doc-card--clickable" : ""}`}
        onClick={isIndexed ? () => navigate(`/documents/${document.id}`) : undefined}
        role={isIndexed ? "button" : undefined}
        tabIndex={isIndexed ? 0 : undefined}
        onKeyDown={
          isIndexed
            ? (event) => {
                if (event.key === "Enter" || event.key === " ") {
                  navigate(`/documents/${document.id}`);
                }
              }
            : undefined
        }
      >
        <div className={`doc-card__thumb doc-card__thumb--${document.thumbnailColor}`} aria-hidden="true">
          PDF
        </div>

        <div className="doc-card__body">
          <h3 className="doc-card__name" title={document.name}>
            {document.name}
          </h3>
          <div className="doc-card__meta">
            <span>{document.category}</span>
            <span aria-hidden="true">·</span>
            <span>{document.pages} pages</span>
            <span aria-hidden="true">·</span>
            <span>{document.sizeMb} MB</span>
          </div>
          {document.status === "processing" && (
            <div className="doc-card__progress">
              <Spinner size={14} />
              <span>{document.processingStep ?? "Processing..."}</span>
            </div>
          )}
          <div className="doc-card__footer">
            <Badge tone={STATUS_TONE[document.status]}>{STATUS_LABEL[document.status]}</Badge>
            <span className="doc-card__date">Added {formatUploadedAt(document.uploadedAt)}</span>
            <div className="doc-card__actions" onClick={(e) => e.stopPropagation()}>
              <DocumentMenu
                document={document}
                groups={groups}
                onRename={(name) => onRename(document.id, name)}
                onMove={(category) => onChangeCategory(document.id, category)}
                onDuplicate={(category) => onDuplicate(document.id, category)}
              />
              <button
                className="doc-card__delete"
                onClick={handleDeleteClick}
                aria-label={`Delete ${document.name}`}
              >
                <TrashIcon />
                Delete
              </button>
            </div>
          </div>
        </div>
      </article>

      {showConfirm && (
        <ConfirmDialog
          title="Delete document"
          message={`Delete "${document.name}"? This cannot be undone.`}
          confirmLabel="Delete"
          onConfirm={() => {
            setShowConfirm(false);
            onDelete(document.id);
          }}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </>
  );
}
