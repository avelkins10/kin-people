"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import type { DocumentWithDetails } from "@/lib/db/helpers/document-helpers";

interface ExpiredDocumentsBannerProps {
  onReview?: () => void;
}

function getName(item: DocumentWithDetails): string | null {
  if (item.recruit) {
    return `${item.recruit.firstName} ${item.recruit.lastName}`.trim() || null;
  }
  if (item.person) {
    return `${item.person.firstName} ${item.person.lastName}`.trim() || null;
  }
  return null;
}

const MAX_NAMES = 5;

export function ExpiredDocumentsBanner({ onReview }: ExpiredDocumentsBannerProps) {
  const [expiredDocuments, setExpiredDocuments] = useState<DocumentWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const namesDisplay = useMemo(() => {
    const names = Array.from(
      new Set(
        expiredDocuments
          .map(getName)
          .filter((n): n is string => n != null && n.length > 0)
      )
    );
    const total = names.length;
    if (total === 0) return { text: "", more: 0 };
    const show = names.slice(0, MAX_NAMES);
    const more = total > MAX_NAMES ? total - MAX_NAMES : 0;
    return {
      text: show.join(", ") + (more > 0 ? ` + ${more} more` : ""),
      more,
    };
  }, [expiredDocuments]);

  const handleReview = useCallback(() => {
    onReview?.();
  }, [onReview]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch("/api/documents?status=expired")
      .then((res) => {
        if (!res.ok) {
          if (res.status === 401 || res.status === 403 || res.status >= 500) {
            return [];
          }
          throw new Error("Failed to fetch expired documents");
        }
        return res.json();
      })
      .then((data: DocumentWithDetails[]) => {
        if (!cancelled && Array.isArray(data)) {
          setExpiredDocuments(data);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.error("[ExpiredDocumentsBanner]", err);
          setError(err instanceof Error ? err.message : "Unknown error");
          setExpiredDocuments([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return null;
  }

  if (error || expiredDocuments.length === 0 || !namesDisplay.text) {
    return null;
  }

  return (
    <Alert
      variant="destructive"
      className="mb-6 bg-red-50 border-red-200 border-l-4 border-l-red-500 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
    >
      <div className="flex items-start gap-3 flex-1 min-w-0">
        <AlertCircle
          className="w-5 h-5 text-red-600 shrink-0 mt-0.5"
          aria-hidden
        />
        <AlertDescription className="text-sm text-red-900 font-bold col-start-2">
          Documents expired for: {namesDisplay.text}
        </AlertDescription>
      </div>
      {onReview != null && (
        <Button
          variant="destructive"
          size="sm"
          onClick={handleReview}
          className="shrink-0 w-full sm:w-auto"
          aria-label="Review expired documents"
        >
          Review
        </Button>
      )}
    </Alert>
  );
}
