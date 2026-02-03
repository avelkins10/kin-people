import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { DocumentStatus } from "@/types/documents";

export type { DocumentStatus } from "@/types/documents";

export interface DocumentStatusBadgeProps {
  /** Document status value from the database */
  status: DocumentStatus;
  /** Optional additional Tailwind classes */
  className?: string;
}

/**
 * Returns badge variant and custom Tailwind color classes for a document status.
 * Color scheme: yellow (pending), blue (viewed), orange (partially_signed),
 * green (signed), red (expired), gray (voided).
 */
function getDocumentStatusConfig(status: DocumentStatus): {
  variant: "outline";
  colorClasses: string;
} {
  const configs: Record<
    DocumentStatus,
    { variant: "outline"; colorClasses: string }
  > = {
    [DocumentStatus.pending]: {
      variant: "outline",
      colorClasses: "bg-yellow-50 text-yellow-700 border-yellow-300",
    },
    [DocumentStatus.viewed]: {
      variant: "outline",
      colorClasses: "bg-blue-50 text-blue-700 border-blue-300",
    },
    [DocumentStatus.partially_signed]: {
      variant: "outline",
      colorClasses: "bg-orange-50 text-orange-700 border-orange-300",
    },
    [DocumentStatus.signed]: {
      variant: "outline",
      colorClasses: "bg-green-50 text-green-700 border-green-300",
    },
    [DocumentStatus.expired]: {
      variant: "outline",
      colorClasses: "bg-red-50 text-red-700 border-red-300",
    },
    [DocumentStatus.voided]: {
      variant: "outline",
      colorClasses: "bg-gray-50 text-gray-700 border-gray-300",
    },
  };
  return configs[status];
}

/**
 * Converts a document status string to user-friendly display text.
 */
function formatStatusLabel(status: DocumentStatus): string {
  const labels: Record<DocumentStatus, string> = {
    [DocumentStatus.pending]: "Pending",
    [DocumentStatus.viewed]: "Viewed",
    [DocumentStatus.partially_signed]: "Partially Signed",
    [DocumentStatus.signed]: "Signed",
    [DocumentStatus.expired]: "Expired",
    [DocumentStatus.voided]: "Voided",
  };
  return labels[status];
}

/**
 * Displays a document status as a colored badge with user-friendly text.
 *
 * Uses the shared Badge component with the "outline" variant and status-specific
 * Tailwind color classes. Follows the same pattern as recruiting and commissions
 * status badges.
 *
 * @example
 * <DocumentStatusBadge status="pending" />
 * <DocumentStatusBadge status="signed" className="ml-2" />
 *
 * Color coding:
 * - Pending: yellow
 * - Viewed: blue
 * - Partially Signed: orange
 * - Signed: green
 * - Expired: red
 * - Voided: gray
 */
function DocumentStatusBadge({ status, className }: DocumentStatusBadgeProps) {
  const { variant, colorClasses } = getDocumentStatusConfig(status);
  const label = formatStatusLabel(status);

  return (
    <Badge
      variant={variant}
      className={cn(colorClasses, className)}
    >
      {label}
    </Badge>
  );
}

export default DocumentStatusBadge;
export { DocumentStatusBadge };
