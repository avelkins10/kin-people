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
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { templateFormSchema, type TemplateFormData } from "@/lib/validation/template-form";

interface SignNowTemplate {
  id: string;
  name: string;
}

/** Template prop accepts API shape (string dates) or schema shape (Date). */
type TemplateForModal = Omit<DocumentTemplate, "createdAt" | "updatedAt"> & {
  createdAt?: Date | string | null | undefined;
  updatedAt?: Date | string | null | undefined;
};

interface DocumentTemplateModalProps {
  open: boolean;
  onClose: () => void;
  template?: TemplateForModal | null;
  documentType: string;
  documentTypeLabel: string;
  onSuccess?: () => void;
}

export function DocumentTemplateModal({
  open,
  onClose,
  template,
  documentType,
  documentTypeLabel,
  onSuccess,
}: DocumentTemplateModalProps) {
  const [signNowTemplates, setSignNowTemplates] = useState<SignNowTemplate[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [templatesError, setTemplatesError] = useState<string | null>(null);

  const form = useForm<TemplateFormData>({
    resolver: zodResolver(templateFormSchema),
    defaultValues: {
      displayName: "",
      signnowTemplateId: "",
      requireRecruit: true,
      requireManager: false,
      requireHR: false,
      expirationDays: 30,
      reminderFrequencyDays: 3,
      description: "",
    },
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = form;

  const signnowTemplateId = watch("signnowTemplateId");
  const requireRecruit = watch("requireRecruit");
  const requireManager = watch("requireManager");
  const requireHR = watch("requireHR");

  useEffect(() => {
    if (open) {
      setTemplatesError(null);
      if (template) {
        reset({
          displayName: template.displayName ?? "",
          signnowTemplateId: template.signnowTemplateId ?? "",
          requireRecruit: template.requireRecruit ?? true,
          requireManager: template.requireManager ?? false,
          requireHR: template.requireHR ?? false,
          expirationDays: template.expirationDays ?? 30,
          reminderFrequencyDays: template.reminderFrequencyDays ?? 3,
          description: template.description ?? "",
        });
      } else {
        reset({
          displayName: documentTypeLabel,
          signnowTemplateId: "",
          requireRecruit: true,
          requireManager: false,
          requireHR: false,
          expirationDays: 30,
          reminderFrequencyDays: 3,
          description: "",
        });
      }
      fetchSignNowTemplates();
    }
  }, [open, template, documentType, documentTypeLabel, reset]);

  async function fetchSignNowTemplates() {
    setTemplatesLoading(true);
    setTemplatesError(null);
    try {
      const res = await fetch("/api/signnow/templates");
      if (res.ok) {
        const data = await res.json();
        setSignNowTemplates(Array.isArray(data) ? data : []);
        setTemplatesError(null);
      } else {
        const body = await res.json().catch(() => ({}));
        const message = (body as { error?: string }).error ?? "Failed to load templates";
        setTemplatesError(message);
        setSignNowTemplates([]);
      }
    } catch {
      setTemplatesError("Failed to load templates. Check that the e-sign integration is configured in Settings → Integrations.");
      setSignNowTemplates([]);
    } finally {
      setTemplatesLoading(false);
    }
  }

  async function onSubmit(data: TemplateFormData) {
    try {
      const url = template
        ? `/api/document-templates/${template.id}`
        : "/api/document-templates";
      const method = template ? "PUT" : "POST";
      const body = template
        ? {
            displayName: data.displayName.trim(),
            signnowTemplateId: data.signnowTemplateId || null,
            requireRecruit: data.requireRecruit,
            requireManager: data.requireManager,
            requireHR: data.requireHR,
            expirationDays: data.expirationDays,
            reminderFrequencyDays: data.reminderFrequencyDays,
            description: data.description?.trim() || null,
          }
        : {
            documentType,
            displayName: data.displayName.trim(),
            signnowTemplateId: data.signnowTemplateId || undefined,
            requireRecruit: data.requireRecruit,
            requireManager: data.requireManager,
            requireHR: data.requireHR,
            expirationDays: data.expirationDays,
            reminderFrequencyDays: data.reminderFrequencyDays,
            description: data.description?.trim() || undefined,
          };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const responseData = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error((responseData as { error?: string }).error || "Request failed");
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
    }
  }

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
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="displayName">Display Name *</Label>
              <Input
                id="displayName"
                {...register("displayName")}
                placeholder="e.g. Rep Agreement"
              />
              {errors.displayName && (
                <p className="text-sm text-destructive mt-1">
                  {errors.displayName.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="signnowTemplate">Template</Label>
              <Select
                value={signnowTemplateId || "none"}
                onValueChange={(v) =>
                  setValue("signnowTemplateId", v === "none" ? "" : v)
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
              {errors.signnowTemplateId && (
                <p className="text-sm text-destructive mt-1">
                  {errors.signnowTemplateId.message}
                </p>
              )}
              {templatesLoading && (
                <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Loading templates…
                </p>
              )}
              {!templatesLoading && templatesError && (
                <p className="text-sm text-amber-700 mt-2 font-medium" role="alert">
                  {templatesError}
                </p>
              )}
              {!templatesLoading && !templatesError && signNowTemplates.length === 0 && (
                <p className="text-xs text-gray-500 mt-2">
                  No SignNow templates found. Configure SignNow in Settings → Integrations and ensure your account has templates.
                </p>
              )}
              <p className="text-xs text-gray-500 mt-2">
                To pre-fill fields (name, email, office, role, etc.), use the field names listed in the document management docs (e.g. <code className="rounded bg-gray-100 px-1">name</code>, <code className="rounded bg-gray-100 px-1">email</code>, <code className="rounded bg-gray-100 px-1">recruit_name</code>).
              </p>
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
                    checked={requireRecruit}
                    onCheckedChange={(checked) =>
                      setValue("requireRecruit", checked === true)
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
                    checked={requireManager}
                    onCheckedChange={(checked) =>
                      setValue("requireManager", checked === true)
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
                    checked={requireHR}
                    onCheckedChange={(checked) =>
                      setValue("requireHR", checked === true)
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
                  {...register("expirationDays", { valueAsNumber: true })}
                  placeholder="30"
                />
                {errors.expirationDays && (
                  <p className="text-sm text-destructive mt-1">
                    {errors.expirationDays.message}
                  </p>
                )}
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
                  {...register("reminderFrequencyDays", { valueAsNumber: true })}
                  placeholder="3"
                />
                {errors.reminderFrequencyDays && (
                  <p className="text-sm text-destructive mt-1">
                    {errors.reminderFrequencyDays.message}
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  How often to send reminders (default 3).
                </p>
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                {...register("description")}
                placeholder="Internal notes about this template"
                rows={2}
                className="resize-none"
              />
              {errors.description && (
                <p className="text-sm text-destructive mt-1">
                  {errors.description.message}
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              aria-label={template ? "Update template" : "Create template"}
            >
              {isSubmitting ? (
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
