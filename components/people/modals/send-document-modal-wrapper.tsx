"use client";

import { useState, useEffect } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SendDocumentModal } from "@/components/documents/send-document-modal";
import type { DocumentTemplate } from "@/lib/db/schema/document-templates";
import { Loader2 } from "lucide-react";

const RECRUIT_ONLY_TYPE = "rep_agreement";
const DOC_TYPE_TEAM_LEAD = "team_lead_agreement";
const DOC_TYPE_AREA_DIRECTOR = "area_director_agreement";

export interface PromotionContext {
  newRoleId: string;
  newRoleName: string;
}

interface SendDocumentModalWrapperProps {
  personId: string;
  open: boolean;
  onClose: () => void;
  promotionContext?: PromotionContext;
}

/** Derive expected document type from role: team lead -> team_lead_agreement, director-level -> area_director_agreement. */
function getExpectedLeadershipDocumentType(role: {
  level?: number;
  name?: string;
}): string | null {
  if (!role) return null;
  const name = (role.name ?? "").toLowerCase();
  const level = typeof role.level === "number" ? role.level : 0;
  // Director-level: Area Director, Regional Manager, or name contains "director"
  const isDirectorLevel =
    name.includes("director") ||
    name.includes("regional manager") ||
    level >= 4;
  if (isDirectorLevel) return DOC_TYPE_AREA_DIRECTOR;
  // Team lead: name contains "lead" (and not director) or manager, or level 3
  const isTeamLead =
    name.includes("lead") ||
    name.includes("manager") ||
    level === 3;
  if (isTeamLead) return DOC_TYPE_TEAM_LEAD;
  return null;
}

export function SendDocumentModalWrapper({
  personId,
  open,
  onClose,
  promotionContext,
}: SendDocumentModalWrapperProps) {
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [selectedDocumentType, setSelectedDocumentType] = useState<string>("");
  const [showSendModal, setShowSendModal] = useState(false);
  const [resolvedDocumentType, setResolvedDocumentType] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setTemplatesLoading(true);
    setTemplates([]);
    setSelectedDocumentType("");
    setShowSendModal(false);
    setResolvedDocumentType(null);

    fetch("/api/document-templates?active=true")
      .then((res) => (res.ok ? res.json() : []))
      .then((data: DocumentTemplate[]) => {
        setTemplates(Array.isArray(data) ? data : []);
      })
      .catch(() => setTemplates([]))
      .finally(() => setTemplatesLoading(false));
  }, [open]);

  useEffect(() => {
    if (!open || !promotionContext || templates.length === 0 || templatesLoading) return;

    const { newRoleId, newRoleName } = promotionContext;
    fetch("/api/roles?active=true")
      .then((res) => (res.ok ? res.json() : []))
      .then((roles: Array<{ id: string; name: string; level?: number }>) => {
        const role = roles.find((r) => r.id === newRoleId) ?? {
          name: newRoleName,
          level: undefined,
        };
        const expectedDocumentType = getExpectedLeadershipDocumentType(role);
        if (!expectedDocumentType) return;

        const matchingTemplate = templates.find(
          (t) => t.documentType === expectedDocumentType
        );
        if (matchingTemplate) {
          setResolvedDocumentType(matchingTemplate.documentType);
          setShowSendModal(true);
        }
      })
      .catch(() => {});
  }, [open, promotionContext, templates, templatesLoading]);

  const peopleTemplates = templates.filter(
    (t) => t.documentType !== RECRUIT_ONLY_TYPE
  );

  function handleOpenSendModal() {
    if (selectedDocumentType) {
      setResolvedDocumentType(selectedDocumentType);
      setShowSendModal(true);
    }
  }

  function handleSendModalClose() {
    setShowSendModal(false);
    setResolvedDocumentType(null);
    setSelectedDocumentType("");
    onClose();
  }

  const showSelection = open && !showSendModal && !resolvedDocumentType;

  return (
    <>
      <Dialog open={showSelection} onOpenChange={(isOpen) => !isOpen && onClose()}>
        <DialogContent className="max-w-md" aria-describedby="send-document-wrapper-description">
          <DialogHeader>
            <DialogTitle>Send Document</DialogTitle>
            <DialogDescription id="send-document-wrapper-description">
              Choose the type of document to send to this person.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {templatesLoading && (
              <div className="flex items-center gap-2 rounded-lg bg-gray-50 p-4 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading templates...
              </div>
            )}
            {!templatesLoading && peopleTemplates.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No document templates available for people.
              </p>
            )}
            {!templatesLoading && peopleTemplates.length > 0 && (
              <div>
                <Label htmlFor="document-type">Document type</Label>
                <Select
                  value={selectedDocumentType}
                  onValueChange={setSelectedDocumentType}
                >
                  <SelectTrigger id="document-type" className="mt-1">
                    <SelectValue placeholder="Select document type" />
                  </SelectTrigger>
                  <SelectContent>
                    {peopleTemplates.map((t) => (
                      <SelectItem key={t.id} value={t.documentType}>
                        {t.displayName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleOpenSendModal}
              disabled={!selectedDocumentType}
            >
              Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {resolvedDocumentType && (
        <SendDocumentModal
          entityType="person"
          entityId={personId}
          documentType={resolvedDocumentType}
          open={showSendModal}
          onClose={handleSendModalClose}
        />
      )}
    </>
  );
}
