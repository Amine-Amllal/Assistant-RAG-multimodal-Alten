import { useEffect } from "react";
import ReactMarkdown from "react-markdown";
import type { DocumentImage } from "../../types";
import "./FigureModal.css";

interface FigureModalProps {
  images: DocumentImage[];
  index: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

export function FigureModal({ images, index, onClose, onNavigate }: FigureModalProps) {
  const image = images[index];

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowRight" && index < images.length - 1) onNavigate(index + 1);
      if (event.key === "ArrowLeft" && index > 0) onNavigate(index - 1);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [index, images.length, onClose, onNavigate]);

  if (!image) return null;

  return (
    <div className="figure-modal__backdrop" onClick={onClose}>
      <div className="figure-modal" onClick={(event) => event.stopPropagation()}>
        <button className="figure-modal__close" onClick={onClose} aria-label="Close">
          ×
        </button>

        <div className="figure-modal__image-wrap">
          {index > 0 && (
            <button
              className="figure-modal__nav figure-modal__nav--prev"
              onClick={() => onNavigate(index - 1)}
              aria-label="Previous figure"
            >
              ‹
            </button>
          )}
          <img className="figure-modal__image" src={image.url} alt={`Figure ${index + 1}`} />
          {index < images.length - 1 && (
            <button
              className="figure-modal__nav figure-modal__nav--next"
              onClick={() => onNavigate(index + 1)}
              aria-label="Next figure"
            >
              ›
            </button>
          )}
        </div>

        <div className="figure-modal__body">
          <div className="figure-modal__meta">
            <span>
              Figure {index + 1} of {images.length}
            </span>
            {image.page !== null && <span>· page {image.page}</span>}
          </div>
          <div className="figure-modal__caption">
            <ReactMarkdown>{image.caption}</ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  );
}
