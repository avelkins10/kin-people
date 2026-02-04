"use client";

import React, { useState, useEffect } from "react";
import { Mail, ChevronDown, ChevronUp, Eye, RotateCcw, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "@/hooks/use-toast";
import {
  SettingsSection,
  SettingsListSkeleton,
} from "@/components/settings/shared";

type EmailTemplateType = "welcome" | "reminder" | "completion";

interface EmailTemplate {
  subject: string;
  body: string;
}

interface TemplateVariable {
  name: string;
  description: string;
}

interface TemplatesResponse {
  templates: Record<EmailTemplateType, EmailTemplate>;
  variables: Record<EmailTemplateType, TemplateVariable[]>;
}

const TEMPLATE_CONFIG: Record<EmailTemplateType, { label: string; description: string }> = {
  welcome: {
    label: "Welcome Email",
    description: "Sent when a recruit is converted to onboarding status",
  },
  reminder: {
    label: "Reminder Email",
    description: "Sent to remind new hires about pending onboarding tasks",
  },
  completion: {
    label: "Completion Email",
    description: "Sent when all onboarding tasks are completed",
  },
};

// Sample data for preview
const SAMPLE_DATA: Record<string, string> = {
  firstName: "Jane",
  lastName: "Smith",
  managerName: "John Doe",
  officeName: " at Downtown Office",
  portalUrl: "https://example.com/onboarding",
  pendingTaskCount: "3",
  taskPlural: "s",
  managerHelp: '<p style="font-size: 14px; color: #6b7280;">If you need help with any tasks, please reach out to John Doe.</p>',
  managerNotification: '<p style="font-size: 16px;">John Doe has been notified of your completion and will be in touch about next steps.</p>',
};

function replaceVariables(text: string, data: Record<string, string>): string {
  let result = text;
  for (const [key, value] of Object.entries(data)) {
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value);
  }
  return result;
}

interface TemplateEditorProps {
  type: EmailTemplateType;
  template: EmailTemplate;
  variables: TemplateVariable[];
  onSave: (template: EmailTemplate) => Promise<void>;
  onReset: () => Promise<void>;
  isExpanded: boolean;
  onToggle: () => void;
}

function TemplateEditor({
  type,
  template,
  variables,
  onSave,
  onReset,
  isExpanded,
  onToggle,
}: TemplateEditorProps) {
  const [subject, setSubject] = useState(template.subject);
  const [body, setBody] = useState(template.body);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const config = TEMPLATE_CONFIG[type];

  // Update local state when template prop changes
  useEffect(() => {
    setSubject(template.subject);
    setBody(template.body);
  }, [template]);

  const hasChanges = subject !== template.subject || body !== template.body;

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({ subject, body });
      toast({ title: "Template saved", description: `${config.label} has been updated.` });
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Error",
        description: e instanceof Error ? e.message : "Failed to save template",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    setResetting(true);
    try {
      await onReset();
      toast({ title: "Template reset", description: `${config.label} has been reset to default.` });
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Error",
        description: e instanceof Error ? e.message : "Failed to reset template",
      });
    } finally {
      setResetting(false);
    }
  };

  const previewSubject = replaceVariables(subject, SAMPLE_DATA);
  const previewBody = replaceVariables(body, SAMPLE_DATA);

  return (
    <div className="border border-gray-200 rounded-sm overflow-hidden">
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
      >
        <div>
          <h3 className="font-medium text-gray-900">{config.label}</h3>
          <p className="text-sm text-gray-500 mt-0.5">{config.description}</p>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-gray-400 shrink-0" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400 shrink-0" />
        )}
      </button>

      {/* Editor */}
      {isExpanded && (
        <div className="p-4 space-y-4">
          {/* Variables reference */}
          <div className="bg-blue-50 border border-blue-100 rounded-sm p-3">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-blue-900">Available Variables</p>
                <p className="text-xs text-blue-700 mt-1">
                  Use these placeholders in your template. They will be replaced with actual values when the email is sent.
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {variables.map((v) => (
                    <TooltipProvider key={v.name}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <code className="text-xs bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded cursor-help">
                            {`{{${v.name}}}`}
                          </code>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{v.description}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Subject */}
          <div>
            <Label htmlFor={`${type}-subject`}>Subject Line</Label>
            <Input
              id={`${type}-subject`}
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Email subject..."
              className="mt-1"
            />
          </div>

          {/* Body */}
          <div>
            <Label htmlFor={`${type}-body`}>Email Body (HTML)</Label>
            <Textarea
              id={`${type}-body`}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Email HTML content..."
              className="mt-1 font-mono text-sm"
              rows={12}
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPreview(true)}
              >
                <Eye className="w-4 h-4 mr-1" />
                Preview
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                disabled={resetting}
                className="text-gray-600"
              >
                <RotateCcw className="w-4 h-4 mr-1" />
                {resetting ? "Resetting..." : "Reset to Default"}
              </Button>
            </div>
            <Button
              onClick={handleSave}
              disabled={saving || !hasChanges}
              size="sm"
            >
              {saving ? "Saving..." : "Save Template"}
            </Button>
          </div>

          {/* Preview Dialog */}
          <Dialog open={showPreview} onOpenChange={setShowPreview}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Email Preview</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label className="text-gray-500">Subject</Label>
                  <p className="font-medium mt-1">{previewSubject}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Body</Label>
                  <div
                    className="mt-2 border rounded-sm overflow-hidden"
                    dangerouslySetInnerHTML={{ __html: previewBody }}
                  />
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      )}
    </div>
  );
}

interface SettingsEmailTemplatesSectionProps {
  onRefetch?: () => void;
}

export function SettingsEmailTemplatesSection({
  onRefetch,
}: SettingsEmailTemplatesSectionProps) {
  const [data, setData] = useState<TemplatesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedType, setExpandedType] = useState<EmailTemplateType | null>(null);

  const fetchTemplates = async () => {
    try {
      const res = await fetch("/api/settings/email-templates");
      if (!res.ok) throw new Error("Failed to fetch templates");
      const json = await res.json();
      setData(json);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleSave = async (type: EmailTemplateType, template: EmailTemplate) => {
    const res = await fetch("/api/settings/email-templates", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [type]: template }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error((err as { error?: string }).error || "Failed to save");
    }
    // Update local state
    setData((prev) =>
      prev
        ? {
            ...prev,
            templates: { ...prev.templates, [type]: template },
          }
        : null
    );
    onRefetch?.();
  };

  const handleReset = async (type: EmailTemplateType) => {
    const res = await fetch(`/api/settings/email-templates?type=${type}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error((err as { error?: string }).error || "Failed to reset");
    }
    const result = await res.json();
    // Update local state with the default template
    setData((prev) =>
      prev
        ? {
            ...prev,
            templates: { ...prev.templates, [type]: result.template },
          }
        : null
    );
    onRefetch?.();
  };

  const templateTypes: EmailTemplateType[] = ["welcome", "reminder", "completion"];

  return (
    <SettingsSection
      icon={Mail}
      title="Email Templates"
      description={
        <>
          Customize the emails sent during the onboarding process. Use placeholders like{" "}
          <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">{"{{firstName}}"}</code> that will be replaced with actual values.
        </>
      }
    >
      {loading ? (
        <SettingsListSkeleton count={3} />
      ) : !data ? (
        <p className="text-sm text-red-600">Failed to load email templates.</p>
      ) : (
        <div className="space-y-3">
          {templateTypes.map((type) => (
            <TemplateEditor
              key={type}
              type={type}
              template={data.templates[type]}
              variables={data.variables[type]}
              onSave={(template) => handleSave(type, template)}
              onReset={() => handleReset(type)}
              isExpanded={expandedType === type}
              onToggle={() => setExpandedType(expandedType === type ? null : type)}
            />
          ))}
        </div>
      )}
    </SettingsSection>
  );
}
