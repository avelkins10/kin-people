"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, FileText } from "lucide-react";
import type { PersonDocument } from "@/types/people";

interface PersonDocumentsProps {
  personId: string;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function PersonDocuments({ personId }: PersonDocumentsProps) {
  const [documents, setDocuments] = useState<PersonDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    fetchDocuments();
  }, [personId]);

  async function fetchDocuments() {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/people/${personId}/documents`);
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Failed to load documents");
      }
      const data = await response.json();
      setDocuments(data);
    } catch (err) {
      console.error("Error fetching documents:", err);
      setError(err instanceof Error ? err.message : "Failed to load documents");
    } finally {
      setLoading(false);
    }
  }

  async function handleDownload(doc: PersonDocument) {
    try {
      setDownloadingId(doc.id);
      const params = new URLSearchParams({ documentPath: doc.documentPath });
      const response = await fetch(
        `/api/people/${personId}/documents/download?${params}`
      );
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Download failed");
      }
      const { signedUrl } = await response.json();
      window.open(signedUrl, "_blank", "noopener,noreferrer");
    } catch (err) {
      console.error("Error downloading document:", err);
      setError(err instanceof Error ? err.message : "Download failed");
    } finally {
      setDownloadingId(null);
    }
  }

  if (loading) {
    return (
      <div className="py-8 text-center text-gray-500">
        Loading documents...
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-8 text-center text-red-600">
        <p>{error}</p>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="py-8 text-center text-gray-500">
        No documents found for this person.
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-white shadow">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Document Name</TableHead>
            <TableHead>Recruit Name</TableHead>
            <TableHead>Document Type</TableHead>
            <TableHead>Signed Date</TableHead>
            <TableHead>File Size</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {documents.map((doc) => (
            <TableRow key={doc.id}>
              <TableCell className="font-medium">{doc.name}</TableCell>
              <TableCell>{doc.recruitName}</TableCell>
              <TableCell>
                <Badge variant="secondary" className="gap-1">
                  <FileText className="h-3 w-3" />
                  Agreement
                </Badge>
              </TableCell>
              <TableCell>
                {doc.signedAt
                  ? format(new Date(doc.signedAt), "MMM d, yyyy")
                  : "-"}
              </TableCell>
              <TableCell>{formatFileSize(doc.fileSize)}</TableCell>
              <TableCell className="text-right">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownload(doc)}
                  disabled={downloadingId === doc.id}
                  aria-label={`Download ${doc.name}`}
                >
                  <Download className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
