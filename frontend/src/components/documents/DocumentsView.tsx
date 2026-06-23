import { useEffect, useMemo, useState } from "react";
import { AppShell } from "../layout/AppShell";
import { Sidebar } from "../layout/Sidebar";
import { DocumentsSidebar } from "./DocumentsSidebar";
import { DocumentCard } from "./DocumentCard";
import { UploadDropzone } from "./UploadDropzone";
import { EmptyState } from "../ui/EmptyState";
import { Spinner } from "../ui/Spinner";
import type { DocumentItem } from "../../types";
import { fetchDocuments, uploadDocument } from "../../api/client";
import "./DocumentsView.css";

export function DocumentsView() {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [category, setCategory] = useState("All");

  useEffect(() => {
    fetchDocuments()
      .then(setDocuments)
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    const hasProcessing = documents.some((doc) => doc.status === "processing");
    if (!hasProcessing) return;
    const interval = setInterval(() => {
      fetchDocuments().then(setDocuments);
    }, 4000);
    return () => clearInterval(interval);
  }, [documents]);

  async function handleFiles(files: File[]) {
    const uploaded = await Promise.all(files.map(uploadDocument));
    setDocuments((prev) => [...uploaded, ...prev]);
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
          <DocumentsSidebar active={category} onSelect={setCategory} counts={counts} />
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
        </header>

        <UploadDropzone onFiles={handleFiles} />

        <div className="documents-view__grid-wrap">
          {isLoading ? (
            <div className="documents-view__loading">
              <Spinner />
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState title="No documents in this category" description="Upload a PDF to get started." />
          ) : (
            <div className="documents-view__grid">
              {filtered.map((doc) => (
                <DocumentCard key={doc.id} document={doc} />
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
