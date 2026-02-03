"use client";

import { DocumentList } from "@/components/documents/document-list";

interface PersonDocumentsProps {
  personId: string;
}

export function PersonDocuments({ personId }: PersonDocumentsProps) {
  return (
    <div>
      <h3 className="font-semibold mb-3">SignNow Documents</h3>
      <DocumentList entityType="person" entityId={personId} />
    </div>
  );
}
