"use client";

import React, { useState } from "react";
import { FileText, Edit2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { DocumentTemplateModal } from "@/components/settings/modals/document-template-modal";
import { toast } from "@/components/ui/use-toast";
import type { DocumentTemplate } from "@/hooks/use-settings-data";
import { cn } from "@/lib/utils";

const DOCUMENT_TYPES = [
  { type: "rep_agreement", label: "Rep Agreement" },
  { type: "tax_forms", label: "Tax Forms" },
  { type: "onboarding_checklist", label: "Onboarding Checklist" },
  { type: "offer_letter", label: "Offer Letter" },
] as const;

interface SettingsDocumentTemplatesSectionProps {
  documentTemplates: DocumentTemplate[];
  loading: boolean;
  onRefetch: () => void;
}

function signerBadges(template: DocumentTemplate): string[] {
  const badges: string[] = [];
  if (template.requireRecruit) badges.push("Recruit");
  if (template.requireManager) badges.push("Manager");
  if (template.requireHR) badges.push("HR");
  return badges;
}

export function SettingsDocumentTemplatesSection({
  documentTemplates,
  loading,
  onRefetch,
}: SettingsDocumentTemplatesSectionProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalDocumentType, setModalDocumentType] = useState<
    (typeof DOCUMENT_TYPES)[number] | null
  >(null);
  const [editTemplate, setEditTemplate] = useState<DocumentTemplate | null>(
    null
  );
  const [deleteTemplate, setDeleteTemplate] =
    useState<DocumentTemplate | null>(null);
  const [saving, setSaving] = useState(false);

  const openConfigure = (docType: (typeof DOCUMENT_TYPES)[number]) => {
    setModalDocumentType(docType);
    const existing = documentTemplates.find(
      (t) => t.documentType === docType.type && t.isActive
    );
    setEditTemplate(existing ?? null);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setModalDocumentType(null);
    setEditTemplate(null);
  };

  const handleDelete = async () => {
    if (!deleteTemplate) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/document-templates/${deleteTemplate.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error || "Failed to deactivate");
      }
      toast({
        title: "Template Deactivated",
        description: "Document template has been deactivated",
      });
      setDeleteTemplate(null);
      onRefetch();
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white border border-gray-100 rounded-sm p-6">
      <div className="flex items-center gap-2 mb-4">
        <FileText className="w-5 h-5 text-indigo-600" />
        <h3 className="text-lg font-extrabold uppercase tracking-tight text-black">
          Document Templates
        </h3>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-20 rounded-sm bg-gray-100 animate-pulse"
              aria-hidden
            />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {DOCUMENT_TYPES.map((docType) => {
            const template = documentTemplates.find(
              (t) => t.documentType === docType.type && t.isActive
            );
            const configured = !!template;

            return (
              <div
                key={docType.type}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-sm group hover:bg-gray-100/80 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <span className="font-bold text-sm text-gray-700 block">
                    {docType.label}
                  </span>
                  <div className="flex flex-wrap items-center gap-1.5 mt-1">
                    <span
                      className={cn(
                        "text-[10px] font-bold uppercase",
                        configured ? "text-green-600" : "text-gray-400"
                      )}
                    >
                      {configured ? "Configured" : "Not Configured"}
                    </span>
                    {template && (
                      <>
                        {template.signnowTemplateId && (
                          <Badge
                            variant="secondary"
                            className="text-[10px] font-normal"
                          >
                            {template.displayName}
                          </Badge>
                        )}
                        {signerBadges(template).map((label) => (
                          <Badge
                            key={label}
                            variant="outline"
                            className="text-[10px] font-normal"
                          >
                            {label}
                          </Badge>
                        ))}
                        {(template.expirationDays ?? 0) > 0 && (
                          <span className="text-[10px] text-gray-500">
                            Expires in {template.expirationDays} days
                          </span>
                        )}
                      </>
                    )}
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 min-w-[44px] min-h-[44px] sm:min-w-[32px] sm:min-h-[32px]"
                    onClick={() => openConfigure(docType)}
                    aria-label={configured ? `Edit ${docType.label}` : `Configure ${docType.label}`}
                  >
                    <Edit2 className="w-3 h-3 text-indigo-600" />
                  </Button>
                  {configured && template && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 min-w-[44px] min-h-[44px] sm:min-w-[32px] sm:min-h-[32px]"
                      onClick={() => setDeleteTemplate(template)}
                      aria-label={`Delete ${docType.label} template`}
                    >
                      <Trash2 className="w-3 h-3 text-red-600" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!loading && documentTemplates.filter((t) => t.isActive).length === 0 && (
        <p className="text-sm text-gray-500 mt-2">
          No document templates configured yet. Click Configure on a document
          type above to get started.
        </p>
      )}

      {modalDocumentType && (
        <DocumentTemplateModal
          open={modalOpen}
          onClose={closeModal}
          template={editTemplate}
          documentType={modalDocumentType.type}
          documentTypeLabel={modalDocumentType.label}
          onSuccess={onRefetch}
        />
      )}

      <AlertDialog
        open={!!deleteTemplate}
        onOpenChange={(open) => !open && setDeleteTemplate(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate document template?</AlertDialogTitle>
            <AlertDialogDescription>
              &quot;{deleteTemplate?.displayName}&quot; will be marked inactive.
              You can configure it again later from this page.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={saving}
              className="bg-red-600"
            >
              {saving ? "Deactivating..." : "Deactivate"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
