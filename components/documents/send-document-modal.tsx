"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import type { RecruitWithDetails } from "@/types/recruiting";
import type { PersonWithDetails } from "@/types/people";
import type { DocumentTemplate } from "@/lib/db/schema/document-templates";
import { Loader2 } from "lucide-react";

interface SignerInfo {
  email: string;
  name: string;
  role: string;
}

interface SendDocumentModalProps {
  entityType: "recruit" | "person";
  entityId: string;
  documentType: string;
  open: boolean;
  onClose: () => void;
  /** When set, modal is in "resend" mode: shows same summary, submit calls resend API */
  resendDocumentId?: string;
}

function getDocumentTitle(documentType: string, displayName?: string): string {
  const name = displayName ?? documentType.replace(/_/g, " ");
  const title = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
  return `Send ${title}`;
}

function buildSigners(
  entityType: "recruit" | "person",
  entityData: RecruitWithDetails | PersonWithDetails,
  template: DocumentTemplate
): SignerInfo[] {
  const metadata = (template.metadata ?? {}) as { signers?: SignerInfo[] };
  if (Array.isArray(metadata.signers) && metadata.signers.length > 0) {
    return metadata.signers;
  }

  const signers: SignerInfo[] = [];

  if (entityType === "recruit") {
    const data = entityData as RecruitWithDetails;
    const r = data.recruit;
    const name = `${r.firstName} ${r.lastName}`;
    const email = r.email ?? "";

    if (template.requireRecruit) {
      signers.push({ name, email, role: "Recruit" });
    }
    if (template.requireManager && data.targetReportsTo) {
      signers.push({
        name: `${data.targetReportsTo.firstName} ${data.targetReportsTo.lastName}`,
        email: data.targetReportsTo.email,
        role: "Manager",
      });
    }
    if (template.requireHR) {
      signers.push({ name: "—", email: "—", role: "HR" });
    }
  } else {
    const data = entityData as PersonWithDetails;
    const p = data.person;
    const name = `${p.firstName} ${p.lastName}`;
    const email = p.email;

    if (template.requireRecruit) {
      signers.push({ name, email, role: "Employee" });
    }
    if (template.requireManager && data.manager) {
      signers.push({
        name: `${data.manager.firstName} ${data.manager.lastName}`,
        email: data.manager.email,
        role: "Manager",
      });
    }
    if (template.requireHR) {
      signers.push({ name: "—", email: "—", role: "HR" });
    }
  }

  return signers;
}

function getEntityDisplayInfo(
  entityType: "recruit" | "person",
  entityData: RecruitWithDetails | PersonWithDetails
): { name: string; email: string; office: string; role: string } {
  if (entityType === "recruit") {
    const data = entityData as RecruitWithDetails;
    const r = data.recruit;
    return {
      name: `${r.firstName} ${r.lastName}`,
      email: r.email ?? "—",
      office: data.targetOffice?.name ?? "N/A",
      role: data.targetRole?.name ?? "N/A",
    };
  }
  const data = entityData as PersonWithDetails;
  const p = data.person;
  return {
    name: `${p.firstName} ${p.lastName}`,
    email: p.email,
    office: data.office?.name ?? "N/A",
    role: data.role?.name ?? "N/A",
  };
}

export function SendDocumentModal({
  entityType,
  entityId,
  documentType,
  open,
  onClose,
  resendDocumentId,
}: SendDocumentModalProps) {
  const isResendMode = Boolean(resendDocumentId);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [entityData, setEntityData] = useState<
    RecruitWithDetails | PersonWithDetails | null
  >(null);
  const [templateConfig, setTemplateConfig] = useState<DocumentTemplate | null>(
    null
  );
  const [signers, setSigners] = useState<SignerInfo[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!open || !entityId) return;

    setError(null);
    setEntityData(null);
    setTemplateConfig(null);
    setSigners([]);
    setDataLoading(true);

    const entityUrl =
      entityType === "recruit"
        ? `/api/recruits/${entityId}`
        : `/api/people/${entityId}`;
    const templatesUrl = "/api/document-templates?active=true";

    Promise.all([fetch(entityUrl), fetch(templatesUrl)])
      .then(async ([entityRes, templatesRes]) => {
        if (!entityRes.ok) {
          const err = await entityRes.json().catch(() => ({}));
          throw new Error(
            (err as { error?: string }).error ?? "Unable to load entity information"
          );
        }
        if (!templatesRes.ok) {
          throw new Error("Unable to load template configuration");
        }

        const [entityJson, templatesJson] = await Promise.all([
          entityRes.json(),
          templatesRes.json(),
        ]);

        setEntityData(entityJson);

        const templates = Array.isArray(templatesJson) ? templatesJson : [];
        const template = templates.find(
          (t: DocumentTemplate) => t.documentType === documentType
        );

        if (!template) {
          setTemplateConfig(null);
          setError("Document template not configured for this document type. Please contact your admin.");
          setSigners([]);
          return;
        }

        setTemplateConfig(template);
        const built = buildSigners(entityType, entityJson, template);
        setSigners(built);
      })
      .catch((err) => {
        setError(
          err instanceof Error ? err.message : "Unable to load entity information"
        );
        setEntityData(null);
        setTemplateConfig(null);
        setSigners([]);
      })
      .finally(() => {
        setDataLoading(false);
      });
  }, [open, entityId, entityType, documentType]);

  async function handleSend() {
    if (!entityData || !templateConfig) {
      setError(
        !templateConfig
          ? "Document template not configured for this document type."
          : "Unable to load entity information."
      );
      return;
    }

    const entityInfo = getEntityDisplayInfo(entityType, entityData);
    if (!entityInfo.email || entityInfo.email === "—") {
      setError("Entity is missing a valid email address.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (isResendMode && resendDocumentId) {
        const res = await fetch(`/api/documents/${resendDocumentId}/resend`, {
          method: "POST",
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError((data as { error?: string }).error ?? "Failed to resend document. Please try again.");
          return;
        }
        const documentTypeLabel =
          documentType === "rep_agreement" ? "Rep Agreement" : templateConfig.displayName;
        toast({
          title: "Document resent",
          description: `${documentTypeLabel} resent to ${entityInfo.name}`,
        });
      } else {
        const url =
          entityType === "recruit"
            ? `/api/recruits/${entityId}/send-document`
            : `/api/people/${entityId}/send-document`;
        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ documentType }),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          setError((data as { error?: string }).error ?? "Failed to send document. Please try again.");
          return;
        }
        const { documentId } = data as { documentId?: string };
        if (documentId) {
          const description =
            entityType === "recruit" && documentType === "rep_agreement"
              ? `Rep Agreement sent to ${entityInfo.name}`
              : `${templateConfig.displayName} sent to ${entityInfo.name}`;
          toast({
            title: "Document Sent",
            description,
          });
        }
      }

      router.refresh();
      window.dispatchEvent(new CustomEvent("documents-updated"));
      onClose();
    } catch {
      setError(isResendMode ? "Failed to resend document. Please try again." : "Failed to send document. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const entityInfo =
    entityData && templateConfig
      ? getEntityDisplayInfo(entityType, entityData)
      : null;
  const canSend =
    !loading &&
    !dataLoading &&
    !!entityData &&
    !!templateConfig &&
    !!entityInfo?.email &&
    entityInfo.email !== "—";

  const modalTitle = isResendMode
    ? `Resend ${templateConfig?.displayName ?? documentType.replace(/_/g, " ")}`
    : getDocumentTitle(documentType, templateConfig?.displayName);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-lg" aria-describedby="send-document-description">
        <DialogHeader>
          <DialogTitle>{modalTitle}</DialogTitle>
          <DialogDescription id="send-document-description">
            This document will be sent for signature. Review the details below
            and confirm to send.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {error && (
            <div
              className="rounded-lg border-l-4 border-red-500 bg-red-50 p-4 text-sm text-red-900"
              role="alert"
            >
              {error}
            </div>
          )}

          {dataLoading && (
            <div className="flex items-center gap-2 rounded-lg bg-gray-50 p-4 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading...
            </div>
          )}

          {!dataLoading && entityInfo && templateConfig && (
            <>
              <div className="space-y-2 rounded-lg bg-gray-50 p-4 text-sm">
                <div className="grid gap-1">
                  <span className="font-medium">Name</span>
                  <span className="text-muted-foreground">{entityInfo.name}</span>
                </div>
                <div className="grid gap-1">
                  <span className="font-medium">Email</span>
                  <span className="text-muted-foreground">{entityInfo.email}</span>
                </div>
                <div className="grid gap-1">
                  <span className="font-medium">Office</span>
                  <span className="text-muted-foreground">{entityInfo.office}</span>
                </div>
                <div className="grid gap-1">
                  <span className="font-medium">Role</span>
                  <span className="text-muted-foreground">{entityInfo.role}</span>
                </div>
                <div className="grid gap-1">
                  <span className="font-medium">Template</span>
                  <span className="text-muted-foreground">
                    {templateConfig.displayName}
                  </span>
                </div>
                <div className="grid gap-1">
                  <span className="font-medium">Expires in</span>
                  <span className="text-muted-foreground">
                    {templateConfig.expirationDays} days
                  </span>
                </div>
              </div>

              {signers.length > 1 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Signers (parallel signing)
                  </Label>
                  <ul className="flex flex-col gap-2">
                    {signers.map((s, i) => (
                      <li
                        key={`${s.role}-${i}`}
                        className="flex items-center gap-2 text-sm"
                      >
                        <Badge variant="secondary" className="h-6 w-6 shrink-0 p-0 justify-center text-xs">
                          {i + 1}
                        </Badge>
                        <span className="font-medium">{s.name}</span>
                        <span className="text-muted-foreground">({s.role})</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="rounded-lg border-l-4 border-blue-500 bg-blue-50 p-4 text-sm text-blue-900">
                <p>
                  This document will be sent to all signers immediately.
                  Automated reminders will be sent every{" "}
                  {templateConfig.reminderFrequencyDays} days until signed.
                </p>
              </div>
            </>
          )}

          {!dataLoading && !entityInfo && !error && open && (
            <div className="rounded-lg bg-gray-50 p-4 text-sm text-muted-foreground">
              No data to display.
            </div>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSend}
            disabled={!canSend}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {isResendMode ? "Resending..." : "Sending..."}
              </>
            ) : isResendMode ? (
              "Resend"
            ) : (
              "Send"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
