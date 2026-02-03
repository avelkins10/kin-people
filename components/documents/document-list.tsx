"use client";

import { useState, useEffect, useCallback } from "react";
import { DocumentItem } from "@/components/documents/document-item";
import { toast } from "@/components/ui/use-toast";
import type { DocumentWithDetails } from "@/lib/db/helpers/document-helpers";

interface DocumentListProps {
  entityType: "recruit" | "person";
  entityId: string;
}

export function DocumentList({ entityType, entityId }: DocumentListProps) {
  const [documents, setDocuments] = useState<DocumentWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDocuments = useCallback(async () => {
    if (!entityId) return;
    setLoading(true);
    setError(null);
    try {
      const param =
        entityType === "recruit" ? `recruitId=${entityId}` : `personId=${entityId}`;
      const res = await fetch(`/api/documents?${param}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          (data as { error?: string }).error ?? "Failed to load documents"
        );
      }
      setDocuments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching documents:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load documents"
      );
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  }, [entityType, entityId]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  useEffect(() => {
    const handler = () => fetchDocuments();
    window.addEventListener("documents-updated", handler);
    return () => window.removeEventListener("documents-updated", handler);
  }, [fetchDocuments]);

  useEffect(() => {
    const POLL_INTERVAL_MS = 25_000;
    const id = setInterval(fetchDocuments, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [fetchDocuments]);

  async function getSignedUrl(documentId: string): Promise<string> {
    const res = await fetch(`/api/documents/${documentId}/download`);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(
        (data as { error?: string }).error ?? "Failed to get document link"
      );
    }
    return (data as { signedUrl: string }).signedUrl;
  }

  async function handleView(documentId: string) {
    try {
      const signedUrl = await getSignedUrl(documentId);
      window.open(signedUrl, "_blank", "noopener,noreferrer");
    } catch (err) {
      toast({
        title: "Error",
        description:
          err instanceof Error ? err.message : "Failed to open document",
        variant: "destructive",
      });
    }
  }

  async function handleDownload(documentId: string) {
    try {
      const signedUrl = await getSignedUrl(documentId);
      const a = document.createElement("a");
      a.href = signedUrl;
      a.download = "";
      a.target = "_blank";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      toast({
        title: "Error",
        description:
          err instanceof Error ? err.message : "Failed to download document",
        variant: "destructive",
      });
    }
  }

  async function handleResend(documentId: string) {
    try {
      const res = await fetch(`/api/documents/${documentId}/resend`, {
        method: "POST",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          (data as { error?: string }).error ?? "Failed to resend"
        );
      }
      toast({
        title: "Document resent",
        description: "A new document has been sent for signature.",
      });
      window.dispatchEvent(new CustomEvent("documents-updated"));
      fetchDocuments();
    } catch (err) {
      toast({
        title: "Error",
        description:
          err instanceof Error ? err.message : "Failed to resend document",
        variant: "destructive",
      });
    }
  }

  if (loading) {
    return (
      <div className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground flex items-center gap-2">
        <span className="animate-pulse">Loading documents...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
        <p>{error}</p>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No documents yet.</p>
    );
  }

  return (
    <div className="space-y-4">
      {documents.map((item) => (
        <DocumentItem
          key={item.document.id}
          item={item}
          onView={handleView}
          onDownload={handleDownload}
          onResend={handleResend}
        />
      ))}
    </div>
  );
}
