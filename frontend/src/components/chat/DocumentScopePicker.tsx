import { useEffect, useRef, useState } from "react";
import type { DocumentItem, Group } from "../../types";
import { fetchDocuments, fetchGroups } from "../../api/client";
import { ChevronDownIcon, FoldersIcon } from "../ui/icons";
import "./DocumentScopePicker.css";

interface DocumentScopePickerProps {
  selectedDocumentIds: string[];
  onChange: (ids: string[]) => void;
  scopeMode: "auto" | "manual";
  onChangeScopeMode: (mode: "auto" | "manual") => void;
}

export function DocumentScopePicker({
  selectedDocumentIds,
  onChange,
  scopeMode,
  onChangeScopeMode,
}: DocumentScopePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [groups, setGroups] = useState<Group[]>([]);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    window.addEventListener("mousedown", handleClickOutside);
    return () => window.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  useEffect(() => {
    // Only the manual scope view needs the document/group list; auto mode never shows it.
    if (!isOpen || scopeMode !== "manual" || groups.length || documents.length) return;
    setIsLoading(true);
    setError(null);
    Promise.all([fetchGroups(), fetchDocuments()])
      .then(([groupsRes, documentsRes]) => {
        setGroups(groupsRes);
        setDocuments(documentsRes.filter((doc) => doc.status === "indexed"));
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load documents"))
      .finally(() => setIsLoading(false));
  }, [isOpen, scopeMode, groups.length, documents.length]);

  function toggleGroupExpanded(groupName: string) {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupName)) next.delete(groupName);
      else next.add(groupName);
      return next;
    });
  }

  function toggleDocument(id: string) {
    onChange(selectedDocumentIds.includes(id) ? selectedDocumentIds.filter((i) => i !== id) : [...selectedDocumentIds, id]);
  }

  function toggleGroupSelection(groupDocs: DocumentItem[]) {
    const groupIds = groupDocs.map((d) => d.id);
    const allSelected = groupIds.every((id) => selectedDocumentIds.includes(id));
    if (allSelected) {
      onChange(selectedDocumentIds.filter((id) => !groupIds.includes(id)));
    } else {
      const merged = new Set([...selectedDocumentIds, ...groupIds]);
      onChange([...merged]);
    }
  }

  const documentsByGroup = groups.map((group) => ({
    group,
    docs: documents.filter((doc) => doc.category === group.name),
  }));

  const selectedCount = selectedDocumentIds.length;
  const isAuto = scopeMode === "auto";
  const label = isAuto
    ? "Documents: Auto"
    : selectedCount > 0
      ? `Documents (${selectedCount})`
      : "Documents: All";

  return (
    <div className="scope-picker" ref={wrapperRef}>
      <button
        type="button"
        className="scope-picker__trigger"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
      >
        <FoldersIcon />
        {label}
      </button>

      {isOpen && (
        <div className="scope-picker__panel" role="dialog" aria-label="Manage documents in scope">
          <div className="scope-picker__modes">
            <button
              type="button"
              className={isAuto ? "scope-picker__mode scope-picker__mode--active" : "scope-picker__mode"}
              onClick={() => onChangeScopeMode("auto")}
            >
              Automatic
            </button>
            <button
              type="button"
              className={!isAuto ? "scope-picker__mode scope-picker__mode--active" : "scope-picker__mode"}
              onClick={() => onChangeScopeMode("manual")}
            >
              Manual
            </button>
          </div>

          {isAuto ? (
            <p className="scope-picker__hint">
              The assistant automatically decides which document groups are relevant to each question and
              searches only those. Switch to <strong>Manual</strong> to choose the scope yourself.
            </p>
          ) : (
            <>
              <div className="scope-picker__header">
                <span className="scope-picker__title">Documents in scope</span>
                <button
                  type="button"
                  className="scope-picker__clear"
                  onClick={() => onChange([])}
                  disabled={selectedCount === 0}
                >
                  All documents
                </button>
              </div>

              <p className="scope-picker__hint">
                {selectedCount === 0
                  ? "No selection: the assistant searches the entire indexed corpus."
                  : `${selectedCount} document${selectedCount === 1 ? "" : "s"} selected.`}
              </p>
            </>
          )}

          {!isAuto && isLoading && <p className="scope-picker__status">Loading…</p>}
          {!isAuto && error && <p className="scope-picker__error">{error}</p>}

          {!isAuto && !isLoading && !error && (
            <div className="scope-picker__groups">
              {documentsByGroup.map(({ group, docs }) => {
                if (docs.length === 0) return null;
                const isExpanded = expandedGroups.has(group.name);
                const selectedInGroup = docs.filter((d) => selectedDocumentIds.includes(d.id)).length;
                const allSelected = selectedInGroup === docs.length;
                const someSelected = selectedInGroup > 0 && !allSelected;

                return (
                  <div className="scope-picker__group" key={group.id}>
                    <div className="scope-picker__group-row">
                      <button
                        type="button"
                        className="scope-picker__expand"
                        onClick={() => toggleGroupExpanded(group.name)}
                        aria-label={isExpanded ? `Collapse ${group.name}` : `Expand ${group.name}`}
                      >
                        <ChevronDownIcon className={isExpanded ? "scope-picker__chevron--open" : ""} />
                      </button>
                      <label className="scope-picker__checkbox-label">
                        <input
                          type="checkbox"
                          checked={allSelected}
                          ref={(el) => {
                            if (el) el.indeterminate = someSelected;
                          }}
                          onChange={() => toggleGroupSelection(docs)}
                        />
                        <span>{group.name}</span>
                        <span className="scope-picker__count">{docs.length}</span>
                      </label>
                    </div>

                    {isExpanded && (
                      <div className="scope-picker__docs">
                        {docs.map((doc) => (
                          <label className="scope-picker__checkbox-label scope-picker__doc-row" key={doc.id}>
                            <input
                              type="checkbox"
                              checked={selectedDocumentIds.includes(doc.id)}
                              onChange={() => toggleDocument(doc.id)}
                            />
                            <span>{doc.name}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
              {documentsByGroup.every(({ docs }) => docs.length === 0) && (
                <p className="scope-picker__status">No indexed documents yet.</p>
              )}
            </div>
          )}

          <div className="scope-picker__footer">
            <button type="button" className="btn btn--primary btn--md" onClick={() => setIsOpen(false)}>
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
