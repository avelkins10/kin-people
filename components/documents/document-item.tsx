"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/components/ui/use-toast";
import DocumentStatusBadge from "@/components/documents/document-status-badge";
import { DocumentStatus } from "@/types/documents";
import type { DocumentWithDetails } from "@/lib/db/helpers/document-helpers";
import { AlertCircle, Check, Clock, Eye, Download, ExternalLink, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface SignerEntry {
  email?: string;
  name?: string;
  role?: string;
  status?: string;
}

export interface DocumentItemProps {
  item: DocumentWithDetails;
  onView: (documentId: string) => Promise<void>;
  onDownload: (documentId: string) => Promise<void>;
  onResend: (documentId: string) => Promise<void>;
  /** When provided, Resend button opens this callback (e.g. to open resend modal) instead of calling onResend */
  onResendClick?: (item: DocumentWithDetails) => void;
}

function DocumentTypeBadge({ documentType }: { documentType: string }) {
  const label = documentType.replace(/_/g, " ");
  return (
    <Badge variant="outline" className="font-normal">
      {label}
    </Badge>
  );
}

const VALID_STATUSES = Object.values(DocumentStatus) as DocumentStatus[];

function toDocumentStatus(status: string | null | undefined): DocumentStatus {
  const s = (status ?? "pending").toLowerCase();
  if (s === "sent") return DocumentStatus.pending;
  return VALID_STATUSES.includes(s as DocumentStatus) ? (s as DocumentStatus) : DocumentStatus.pending;
}

export function DocumentItem({ item, onView, onDownload, onResend, onResendClick }: DocumentItemProps) {
  const { document } = item;
  const status = toDocumentStatus(document.status);
  const totalSigners = document.totalSigners ?? 1;
  const signedCount = document.signedCount ?? 0;
  const showProgress = totalSigners > 1;
  const progressPct =
    totalSigners > 0 ? Math.round((signedCount / totalSigners) * 100) : 0;
  const metadata = (document.metadata ?? {}) as { signers?: SignerEntry[] };
  const signers = Array.isArray(metadata.signers) ? metadata.signers : [];

  const [loadingView, setLoadingView] = useState(false);
  const [loadingDownload, setLoadingDownload] = useState(false);
  const [loadingResend, setLoadingResend] = useState(false);

  async function handleView() {
    setLoadingView(true);
    try {
      await onView(document.id);
    } finally {
      setLoadingView(false);
    }
  }

  async function handleDownload() {
    setLoadingDownload(true);
    try {
      await onDownload(document.id);
    } finally {
      setLoadingDownload(false);
    }
  }

  async function handleResend() {
    if (onResendClick) {
      onResendClick(item);
      return;
    }
    setLoadingResend(true);
    try {
      await onResend(document.id);
    } finally {
      setLoadingResend(false);
    }
  }

  return (
    <div className="rounded-lg border bg-card p-4 text-card-foreground shadow-sm">
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <DocumentTypeBadge documentType={document.documentType} />
        <DocumentStatusBadge status={status} />
      </div>
      <div className="text-sm text-muted-foreground space-y-1 mb-3">
        {document.sentAt && (
          <div>
            <span className="text-foreground/80">Sent:</span>{" "}
            {new Date(document.sentAt).toLocaleDateString()}
          </div>
        )}
        {status === DocumentStatus.signed && document.signedAt && (
          <div>
            <span className="text-foreground/80">Signed:</span>{" "}
            {new Date(document.signedAt).toLocaleDateString()}
          </div>
        )}
        {document.expiresAt && (
          <div
            className={cn(
              status === DocumentStatus.expired && "text-red-700 font-medium"
            )}
          >
            {status === DocumentStatus.expired && (
              <AlertCircle className="h-3 w-3 text-red-700 inline mr-1" />
            )}
            <span className={status === DocumentStatus.expired ? "text-red-700" : "text-foreground/80"}>
              Expires:
            </span>{" "}
            {new Date(document.expiresAt).toLocaleDateString()}
          </div>
        )}
      </div>

      {showProgress && (
        <div className="mb-3">
          <div className="text-xs font-medium text-muted-foreground mb-1">
            Signing Progress: {progressPct}% ({signedCount} of {totalSigners}{" "}
            signed)
          </div>
          <Progress value={progressPct} className="h-2" />
        </div>
      )}

      {signers.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {signers.map((s, i) => {
            const signerStatus = (s.status ?? "pending").toLowerCase();
            const isSigned = signerStatus === "signed";
            const isViewed = signerStatus === "viewed";
            return (
              <span
                key={`${s.email ?? i}-${i}`}
                className={cn(
                  "inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs",
                  isSigned && "bg-green-50 text-green-800 border-green-200",
                  isViewed &&
                    !isSigned &&
                    "bg-blue-50 text-blue-800 border-blue-200",
                  !isSigned && !isViewed && "bg-muted/50 text-muted-foreground"
                )}
              >
                {isSigned && <Check className="h-3 w-3" />}
                {isViewed && !isSigned && <Eye className="h-3 w-3" />}
                {!isSigned && !isViewed && <Clock className="h-3 w-3" />}
                <span>{s.name ?? s.email ?? `Signer ${i + 1}`}</span>
              </span>
            );
          })}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleView}
          disabled={loadingView || loadingDownload}
          aria-label="View document"
        >
          {loadingView ? (
            "Loading..."
          ) : (
            <>
              <ExternalLink className="h-4 w-4 mr-2" />
              View
            </>
          )}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleDownload}
          disabled={loadingView || loadingDownload}
          aria-label="Download document"
        >
          {loadingDownload ? (
            "Loading..."
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              Download
            </>
          )}
        </Button>
        {status === DocumentStatus.expired && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleResend}
            disabled={loadingResend}
            aria-label="Resend document"
          >
            {loadingResend ? (
              "Resending..."
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Resend
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
