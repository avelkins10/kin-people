"use client";

import { DocumentList } from "@/components/documents/document-list";
import type { DocumentWithDetails } from "@/lib/db/helpers/document-helpers";

interface PersonDocumentsProps {
  personId: string;
  /** When provided, Resend opens Send Document modal in resend mode */
  onResendClick?: (item: DocumentWithDetails) => void;
}

export function PersonDocuments({ personId, onResendClick }: PersonDocumentsProps) {
  return (
    <div>
      <h3 className="font-semibold mb-3">Documents</h3>
      <DocumentList entityType="person" entityId={personId} onResendClick={onResendClick} />
    </div>
  );
}
