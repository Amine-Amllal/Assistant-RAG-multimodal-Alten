import { useEffect, useRef, useState } from "react";
import type { DocumentItem, Group } from "../../types";
import { CopyIcon, FolderIcon, MoreIcon, PencilIcon } from "../ui/icons";
import "./DocumentMenu.css";

type DialogMode = "rename" | "move" | "duplicate" | null;

interface DocumentMenuProps {
  document: DocumentItem;
  groups: Group[];
  onRename: (name: string) => Promise<void>;
  onMove: (category: string) => Promise<void>;
  onDuplicate: (category: string) => Promise<void>;
}

export function DocumentMenu({ document, groups, onRename, onMove, onDuplicate }: DocumentMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<DialogMode>(null);
  const [nameValue, setNameValue] = useState(document.name);
  const [groupValue, setGroupValue] = useState(document.category);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    window.document.addEventListener("mousedown", handleClickOutside);
    return () => window.document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  function openDialog(mode: DialogMode) {
    setError(null);
    setNameValue(document.name);
    setGroupValue(document.category);
    setDialogMode(mode);
    setIsOpen(false);
  }

  async function handleConfirm() {
    setError(null);
    setIsSubmitting(true);
    try {
      if (dialogMode === "rename") {
        const name = nameValue.trim();
        if (name && name !== document.name) await onRename(name);
      } else if (dialogMode === "move") {
        if (groupValue !== document.category) await onMove(groupValue);
      } else if (dialogMode === "duplicate") {
        await onDuplicate(groupValue);
      }
      setDialogMode(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="doc-menu" ref={wrapperRef} onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        className="doc-menu__trigger"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={`More actions for ${document.name}`}
        aria-haspopup="menu"
        aria-expanded={isOpen}
      >
        <MoreIcon />
      </button>

      {isOpen && (
        <div className="doc-menu__dropdown" role="menu">
          <button type="button" role="menuitem" onClick={() => openDialog("rename")}>
            <PencilIcon />
            Rename
          </button>
          <button type="button" role="menuitem" onClick={() => openDialog("move")}>
            <FolderIcon />
            Move to group
          </button>
          <button
            type="button"
            role="menuitem"
            disabled={document.status !== "indexed"}
            onClick={() => openDialog("duplicate")}
          >
            <CopyIcon />
            Duplicate to group
          </button>
        </div>
      )}

      {dialogMode && (
        <div className="doc-menu__backdrop" onClick={() => setDialogMode(null)}>
          <div className="doc-menu__dialog" onClick={(e) => e.stopPropagation()}>
            <h2 className="doc-menu__dialog-title">
              {dialogMode === "rename" && "Rename document"}
              {dialogMode === "move" && "Move to group"}
              {dialogMode === "duplicate" && "Duplicate to group"}
            </h2>

            {dialogMode === "rename" ? (
              <input
                className="doc-menu__input"
                value={nameValue}
                autoFocus
                onChange={(e) => setNameValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleConfirm()}
              />
            ) : (
              <select className="doc-menu__input" value={groupValue} onChange={(e) => setGroupValue(e.target.value)}>
                {groups.map((group) => (
                  <option key={group.id} value={group.name}>
                    {group.name}
                  </option>
                ))}
              </select>
            )}

            {error && <p className="doc-menu__error">{error}</p>}

            <div className="doc-menu__dialog-actions">
              <button className="btn btn--secondary btn--md" onClick={() => setDialogMode(null)}>
                Cancel
              </button>
              <button className="btn btn--primary btn--md" onClick={handleConfirm} disabled={isSubmitting}>
                {dialogMode === "rename" && "Rename"}
                {dialogMode === "move" && "Move"}
                {dialogMode === "duplicate" && "Duplicate"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
