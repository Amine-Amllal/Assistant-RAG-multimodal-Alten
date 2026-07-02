import { useEffect, useMemo, useState } from "react";
import { AppShell } from "../layout/AppShell";
import { Sidebar } from "../layout/Sidebar";
import { DocumentsSidebar } from "./DocumentsSidebar";
import { DocumentCard } from "./DocumentCard";
import { UploadDropzone } from "./UploadDropzone";
import { EmptyState } from "../ui/EmptyState";
import { Spinner } from "../ui/Spinner";
import { GridIcon, ListIcon } from "../ui/icons";
import type { DocumentItem, Group } from "../../types";
import {
  createGroup,
  deleteDocument,
  deleteGroup,
  duplicateDocument,
  fetchDocuments,
  fetchGroups,
  renameGroup,
  updateDocumentCategory,
  updateDocumentName,
  uploadDocument,
} from "../../api/client";
import "./DocumentsView.css";

type ViewMode = "list" | "grid";

const VIEW_MODE_STORAGE_KEY = "documents-view-mode";
const DEFAULT_GROUP_NAME = "Uncategorized";

export function DocumentsView() {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [category, setCategory] = useState("All");
  const [uploadGroup, setUploadGroup] = useState(DEFAULT_GROUP_NAME);
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const stored = localStorage.getItem(VIEW_MODE_STORAGE_KEY);
    return stored === "grid" ? "grid" : "list";
  });

  useEffect(() => {
    localStorage.setItem(VIEW_MODE_STORAGE_KEY, viewMode);
  }, [viewMode]);

  useEffect(() => {
    fetchDocuments()
      .then(setDocuments)
      .finally(() => setIsLoading(false));
    fetchGroups().then(setGroups);
  }, []);

  useEffect(() => {
    const hasProcessing = documents.some((doc) => doc.status === "processing");
    if (!hasProcessing) return;
    const interval = setInterval(() => {
      fetchDocuments().then(setDocuments);
    }, 1500);
    return () => clearInterval(interval);
  }, [documents]);

  async function handleFiles(files: File[]) {
    const uploaded = await Promise.all(files.map((file) => uploadDocument(file, uploadGroup)));
    setDocuments((prev) => [...uploaded, ...prev]);
  }

  async function handleDelete(id: string) {
    await deleteDocument(id);
    setDocuments((prev) => prev.filter((doc) => doc.id !== id));
  }

  async function handleChangeCategory(id: string, newCategory: string) {
    const updated = await updateDocumentCategory(id, newCategory);
    setDocuments((prev) => prev.map((doc) => (doc.id === id ? updated : doc)));
  }

  async function handleRenameDocument(id: string, name: string) {
    const updated = await updateDocumentName(id, name);
    setDocuments((prev) => prev.map((doc) => (doc.id === id ? updated : doc)));
  }

  async function handleDuplicateDocument(id: string, targetCategory: string) {
    const duplicate = await duplicateDocument(id, targetCategory);
    setDocuments((prev) => [duplicate, ...prev]);
  }

  async function handleCreateGroup(name: string) {
    const group = await createGroup(name);
    setGroups((prev) => [...prev, group].sort((a, b) => a.name.localeCompare(b.name)));
  }

  async function handleRenameGroup(id: string, name: string) {
    const oldGroup = groups.find((g) => g.id === id);
    await renameGroup(id, name);
    setGroups((prev) =>
      prev.map((g) => (g.id === id ? { ...g, name } : g)).sort((a, b) => a.name.localeCompare(b.name)),
    );
    if (oldGroup) {
      setDocuments((prev) => prev.map((doc) => (doc.category === oldGroup.name ? { ...doc, category: name } : doc)));
    }
  }

  async function handleDeleteGroup(id: string) {
    const group = groups.find((g) => g.id === id);
    await deleteGroup(id);
    setGroups((prev) => prev.filter((g) => g.id !== id));
    if (group) {
      setDocuments((prev) =>
        prev.map((doc) => (doc.category === group.name ? { ...doc, category: DEFAULT_GROUP_NAME } : doc)),
      );
      if (category === group.name) setCategory("All");
    }
  }

  const counts = useMemo(() => {
    const result: Record<string, number> = { All: documents.length };
    for (const doc of documents) {
      result[doc.category] = (result[doc.category] ?? 0) + 1;
    }
    return result;
  }, [documents]);

  const filtered = useMemo(
    () => (category === "All" ? documents : documents.filter((d) => d.category === category)),
    [documents, category],
  );

  return (
    <AppShell
      sidebar={
        <Sidebar>
          <DocumentsSidebar
            active={category}
            onSelect={setCategory}
            counts={counts}
            groups={groups}
            onCreateGroup={handleCreateGroup}
            onRenameGroup={handleRenameGroup}
            onDeleteGroup={handleDeleteGroup}
          />
        </Sidebar>
      }
    >
      <div className="documents-view">
        <header className="documents-view__header">
          <div>
            <h1>Documents</h1>
            <p className="documents-view__subtitle">
              Manage the corpus the assistant retrieves answers from.
            </p>
          </div>
          <div className="documents-view__view-toggle" role="group" aria-label="Choose document layout">
            <button
              type="button"
              className={`documents-view__view-toggle-btn${viewMode === "list" ? " documents-view__view-toggle-btn--active" : ""}`}
              onClick={() => setViewMode("list")}
              aria-pressed={viewMode === "list"}
              aria-label="List view"
            >
              <ListIcon />
            </button>
            <button
              type="button"
              className={`documents-view__view-toggle-btn${viewMode === "grid" ? " documents-view__view-toggle-btn--active" : ""}`}
              onClick={() => setViewMode("grid")}
              aria-pressed={viewMode === "grid"}
              aria-label="Grid view"
            >
              <GridIcon />
            </button>
          </div>
        </header>

        <div className="documents-view__upload-target">
          <label htmlFor="upload-group-select">Upload to group</label>
          <select id="upload-group-select" value={uploadGroup} onChange={(e) => setUploadGroup(e.target.value)}>
            {groups.map((group) => (
              <option key={group.id} value={group.name}>
                {group.name}
              </option>
            ))}
          </select>
        </div>

        <UploadDropzone onFiles={handleFiles} />

        <div className="documents-view__grid-wrap">
          {isLoading ? (
            <div className="documents-view__loading">
              <Spinner />
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState title="No documents in this category" description="Upload a document to get started." />
          ) : (
            <div className={`documents-view__grid documents-view__grid--${viewMode}`}>
              {filtered.map((doc) => (
                <DocumentCard
                  key={doc.id}
                  document={doc}
                  groups={groups}
                  onDelete={handleDelete}
                  onChangeCategory={handleChangeCategory}
                  onRename={handleRenameDocument}
                  onDuplicate={handleDuplicateDocument}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
