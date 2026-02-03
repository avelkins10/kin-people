import { DocumentStatus, DocumentType } from "@/types/documents";

/**
 * Calculate signing progress as a percentage (0–100).
 */
export function calculateProgress(signedCount: number, totalSigners: number): number {
  if (totalSigners <= 0) return 0;
  const pct = (signedCount / totalSigners) * 100;
  return Math.round(Math.min(100, Math.max(0, pct)));
}

/**
 * Return Tailwind color name for a document status (e.g. "yellow", "green").
 */
export function getDocumentStatusColor(status: DocumentStatus): string {
  const colors: Record<DocumentStatus, string> = {
    [DocumentStatus.pending]: "yellow",
    [DocumentStatus.viewed]: "blue",
    [DocumentStatus.partially_signed]: "orange",
    [DocumentStatus.signed]: "green",
    [DocumentStatus.expired]: "red",
    [DocumentStatus.voided]: "gray",
  };
  return colors[status] ?? "gray";
}

/**
 * Convert document type enum/value to human-readable display name.
 */
export function formatDocumentType(type: DocumentType | string): string {
  const labels: Record<string, string> = {
    rep_agreement: "Rep Agreement",
    tax_forms: "Tax Forms",
    onboarding_checklist: "Onboarding Checklist",
    offer_letter: "Offer Letter",
    leadership_agreement: "Leadership Agreement",
  };
  return labels[type] ?? type;
}

/**
 * Return true if the document's expiration date is in the past.
 */
export function isDocumentExpired(expiresAt: Date | string | null): boolean {
  if (expiresAt == null) return false;
  const date = typeof expiresAt === "string" ? new Date(expiresAt) : expiresAt;
  return date.getTime() < Date.now();
}
