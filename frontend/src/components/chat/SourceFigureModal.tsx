import { useEffect } from "react";
import type { ChatSource } from "../../types";
import "./SourceFigureModal.css";

interface SourceFigureModalProps {
  source: ChatSource;
  onClose: () => void;
}

export function SourceFigureModal({ source, onClose }: SourceFigureModalProps) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div className="source-figure-modal__backdrop" onClick={onClose}>
      <div className="source-figure-modal" onClick={(event) => event.stopPropagation()}>
        <button className="source-figure-modal__close" onClick={onClose} aria-label="Close">
          ×
        </button>

        {source.imageUrl && (
          <div className="source-figure-modal__image-wrap">
            <img className="source-figure-modal__image" src={source.imageUrl} alt={source.caption ?? "Source figure"} />
          </div>
        )}

        <div className="source-figure-modal__body">
          <div className="source-figure-modal__meta">
            <span>{source.documentName}</span>
            <span>· page {source.page}</span>
          </div>
          {source.caption && <p className="source-figure-modal__caption">{source.caption}</p>}
        </div>
      </div>
    </div>
  );
}
