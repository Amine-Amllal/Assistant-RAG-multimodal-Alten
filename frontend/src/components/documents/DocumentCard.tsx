import type { DocumentItem } from "../../types";
import { Badge } from "../ui/Badge";
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

export function DocumentCard({ document }: { document: DocumentItem }) {
  return (
    <article className="doc-card">
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
        <div className="doc-card__footer">
          <Badge tone={STATUS_TONE[document.status]}>{STATUS_LABEL[document.status]}</Badge>
          <span className="doc-card__date">Added {document.uploadedAt}</span>
        </div>
      </div>
    </article>
  );
}
