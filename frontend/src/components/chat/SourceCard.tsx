import { useState } from "react";
import type { ChatSource } from "../../types";
import { Badge } from "../ui/Badge";
import { stripMarkdown, truncateText } from "../../lib/markdown";
import { SourceFigureModal } from "./SourceFigureModal";
import "./SourceCard.css";

const CAPTION_PREVIEW_LENGTH = 90;

export function SourceCard({ source }: { source: ChatSource }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const cleanCaption = source.caption ? stripMarkdown(source.caption) : null;
  const isCaptionLong = !!cleanCaption && cleanCaption.length > CAPTION_PREVIEW_LENGTH;

  return (
    <>
      <article className="source-card">
        <header className="source-card__header">
          <Badge tone={source.kind === "image" ? "blue" : "black"}>
            {source.kind === "image" ? "Figure" : "Excerpt"}
          </Badge>
          <span className="source-card__score">{source.rank === 1 ? "Top match" : `#${source.rank} match`}</span>
        </header>

        {source.kind === "image" && source.imageUrl && (
          <img className="source-card__image" src={source.imageUrl} alt={cleanCaption ?? "Source figure"} />
        )}

        {source.kind === "text" && source.excerpt && (
          <p className="source-card__excerpt">&ldquo;{source.excerpt}&rdquo;</p>
        )}

        {cleanCaption && (
          <div className="source-card__caption-block">
            <p className="source-card__caption">{truncateText(cleanCaption, CAPTION_PREVIEW_LENGTH)}</p>
            {isCaptionLong && (
              <button type="button" className="source-card__caption-toggle" onClick={() => setIsModalOpen(true)}>
                More
              </button>
            )}
          </div>
        )}

        <footer className="source-card__footer">
          <span className="source-card__doc">{source.documentName}</span>
          <span className="source-card__page">p. {source.page}</span>
        </footer>
      </article>

      {isModalOpen && <SourceFigureModal source={source} onClose={() => setIsModalOpen(false)} />}
    </>
  );
}
