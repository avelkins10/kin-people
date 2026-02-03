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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import type { DocumentTemplate } from "@/lib/db/schema/document-templates";
import { Loader2 } from "lucide-react";

interface SignNowTemplate {
  id: string;
  name: string;
}

interface DocumentTemplateModalProps {
  open: boolean;
  onClose: () => void;
  template?: DocumentTemplate | null;
  documentType: string;
  documentTypeLabel: string;
  onSuccess?: () => void;
}

const defaultFormData = {
  displayName: "",
  signnowTemplateId: "",
  requireRecruit: true,
  requireManager: false,
  requireHR: false,
  expirationDays: "30",
  reminderFrequencyDays: "3",
  description: "",
};

export function DocumentTemplateModal({
  open,
  onClose,
  template,
  documentType,
  documentTypeLabel,
  onSuccess,
}: DocumentTemplateModalProps) {
  const [loading, setLoading] = useState(false);
  const [signNowTemplates, setSignNowTemplates] = useState<SignNowTemplate[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [formData, setFormData] = useState(defaultFormData);

  useEffect(() => {
    if (open) {
      setFormData(
        template
          ? {
              displayName: template.displayName ?? "",
              signnowTemplateId: template.signnowTemplateId ?? "",
              requireRecruit: template.requireRecruit ?? true,
              requireManager: template.requireManager ?? false,
              requireHR: template.requireHR ?? false,
              expirationDays: String(template.expirationDays ?? 30),
              reminderFrequencyDays: String(template.reminderFrequencyDays ?? 3),
              description: template.description ?? "",
            }
          : {
              ...defaultFormData,
              displayName: documentTypeLabel,
            }
      );
      fetchSignNowTemplates();
    }
  }, [open, template, documentType, documentTypeLabel]);

  async function fetchSignNowTemplates() {
    setTemplatesLoading(true);
    try {
      const res = await fetch("/api/signnow/templates");
      if (res.ok) {
        const data = await res.json();
        setSignNowTemplates(Array.isArray(data) ? data : []);
      } else {
        setSignNowTemplates([]);
      }
    } catch {
      setSignNowTemplates([]);
    } finally {
      setTemplatesLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.displayName.trim()) {
      toast({
        title: "Validation Error",
        description: "Display name is required",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    try {
      const exp = parseInt(formData.expirationDays, 10);
      const rem = parseInt(formData.reminderFrequencyDays, 10);
      const expirationDays = Number.isNaN(exp) ? 30 : exp;
      const reminderFrequencyDays = Number.isNaN(rem) ? 3 : rem;

      const url = template
        ? `/api/document-templates/${template.id}`
        : "/api/document-templates";
      const method = template ? "PUT" : "POST";
      const body = template
        ? {
            displayName: formData.displayName.trim(),
            signnowTemplateId: formData.signnowTemplateId || null,
            requireRecruit: formData.requireRecruit,
            requireManager: formData.requireManager,
            requireHR: formData.requireHR,
            expirationDays,
            reminderFrequencyDays,
            description: formData.description.trim() || null,
          }
        : {
            documentType,
            displayName: formData.displayName.trim(),
            signnowTemplateId: formData.signnowTemplateId || undefined,
            requireRecruit: formData.requireRecruit,
            requireManager: formData.requireManager,
            requireHR: formData.requireHR,
            expirationDays,
            reminderFrequencyDays,
            description: formData.description.trim() || undefined,
          };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error((data as { error?: string }).error || "Request failed");
      }

      if (template) {
        toast({
          title: "Template Updated",
          description: "Document template updated successfully",
        });
      } else {
        toast({
          title: "Template Created",
          description: "Document template configured successfully",
        });
      }
      onSuccess?.();
      onClose();
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  const expDays = parseInt(formData.expirationDays, 10);
  const remDays = parseInt(formData.reminderFrequencyDays, 10);
  const isValid =
    formData.displayName.trim().length > 0 &&
    (formData.expirationDays === "" || (!Number.isNaN(expDays) && expDays >= 0)) &&
    (formData.reminderFrequencyDays === "" || (!Number.isNaN(remDays) && remDays >= 0));

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {template ? "Edit Document Template" : "Configure Document Template"}
          </DialogTitle>
          <DialogDescription>
            {template
              ? "Update the document template settings."
              : `Set up the document template and signer requirements for ${documentTypeLabel}.`}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="displayName">Display Name *</Label>
              <Input
                id="displayName"
                value={formData.displayName}
                onChange={(e) =>
                  setFormData({ ...formData, displayName: e.target.value })
                }
                placeholder="e.g. Rep Agreement"
                required
              />
            </div>

            <div>
              <Label htmlFor="signnowTemplate">Template</Label>
              <Select
                value={formData.signnowTemplateId || "none"}
                onValueChange={(v) =>
                  setFormData({
                    ...formData,
                    signnowTemplateId: v === "none" ? "" : v,
                  })
                }
                disabled={templatesLoading}
              >
                <SelectTrigger id="signnowTemplate">
                  <SelectValue
                    placeholder={
                      templatesLoading
                        ? "Loading templates..."
                        : "Select a template"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {signNowTemplates.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {templatesLoading && (
                <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Loading templates…
                </p>
              )}
            </div>

            <div className="border-t pt-4">
              <Label className="text-sm font-medium">Signer Requirements</Label>
              <p className="text-xs text-gray-500 mb-2">
                Who must sign this document? At least one signer is recommended.
              </p>
              <div className="flex flex-wrap gap-4 mt-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="requireRecruit"
                    checked={formData.requireRecruit}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        requireRecruit: checked === true,
                      })
                    }
                  />
                  <Label
                    htmlFor="requireRecruit"
                    className="text-sm font-normal cursor-pointer"
                  >
                    Require Recruit/Employee
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="requireManager"
                    checked={formData.requireManager}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        requireManager: checked === true,
                      })
                    }
                  />
                  <Label
                    htmlFor="requireManager"
                    className="text-sm font-normal cursor-pointer"
                  >
                    Require Manager
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="requireHR"
                    checked={formData.requireHR}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        requireHR: checked === true,
                      })
                    }
                  />
                  <Label
                    htmlFor="requireHR"
                    className="text-sm font-normal cursor-pointer"
                  >
                    Require HR
                  </Label>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="expirationDays">Expiration (days)</Label>
                <Input
                  id="expirationDays"
                  type="number"
                  min={0}
                  value={formData.expirationDays}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      expirationDays: e.target.value,
                    })
                  }
                  placeholder="30"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Days until the document link expires (default 30).
                </p>
              </div>
              <div>
                <Label htmlFor="reminderFrequencyDays">Reminder (days)</Label>
                <Input
                  id="reminderFrequencyDays"
                  type="number"
                  min={0}
                  value={formData.reminderFrequencyDays}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      reminderFrequencyDays: e.target.value,
                    })
                  }
                  placeholder="3"
                />
                <p className="text-xs text-gray-500 mt-1">
                  How often to send reminders (default 3).
                </p>
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Internal notes about this template"
                rows={2}
                className="resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !isValid}
              aria-label={template ? "Update template" : "Create template"}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {template ? "Updating..." : "Creating..."}
                </>
              ) : template ? (
                "Update"
              ) : (
                "Create"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
