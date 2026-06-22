import type { ChatSource } from "../../types";
import { Badge } from "../ui/Badge";
import "./SourceCard.css";

export function SourceCard({ source }: { source: ChatSource }) {
  return (
    <article className="source-card">
      <header className="source-card__header">
        <Badge tone={source.kind === "image" ? "blue" : "black"}>
          {source.kind === "image" ? "Figure" : "Excerpt"}
        </Badge>
        <span className="source-card__score">{Math.round(source.score * 100)}% match</span>
      </header>

      {source.kind === "image" && source.imageUrl && (
        <img className="source-card__image" src={source.imageUrl} alt={source.caption ?? "Source figure"} />
      )}

      {source.kind === "text" && source.excerpt && (
        <p className="source-card__excerpt">&ldquo;{source.excerpt}&rdquo;</p>
      )}

      {source.caption && <p className="source-card__caption">{source.caption}</p>}

      <footer className="source-card__footer">
        <span className="source-card__doc">{source.documentName}</span>
        <span className="source-card__page">p. {source.page}</span>
      </footer>
    </article>
  );
}
