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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import type { RecruitWithDetails } from "@/types/recruiting";

interface SendAgreementModalProps {
  recruitId: string;
  open: boolean;
  onClose: () => void;
}

interface SignNowTemplate {
  id: string;
  name: string;
}

export function SendAgreementModal({
  recruitId,
  open,
  onClose,
}: SendAgreementModalProps) {
  const [recruit, setRecruit] = useState<RecruitWithDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState<SignNowTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [signerName, setSignerName] = useState<string>("");
  const [signerEmail, setSignerEmail] = useState<string>("");
  const router = useRouter();

  useEffect(() => {
    if (open && recruitId) {
      fetchRecruit();
      fetchTemplates();
    }
  }, [open, recruitId]);

  async function fetchRecruit() {
    try {
      const response = await fetch(`/api/recruits/${recruitId}`);
      if (response.ok) {
        const data = await response.json();
        setRecruit(data);
        // Pre-fill signer details from recruit
        if (data.recruit) {
          setSignerName(`${data.recruit.firstName} ${data.recruit.lastName}`);
          setSignerEmail(data.recruit.email || "");
        }
      }
    } catch (error) {
      console.error("Error fetching recruit:", error);
    }
  }

  async function fetchTemplates() {
    setLoadingTemplates(true);
    try {
      const response = await fetch("/api/signnow/templates");
      if (response.ok) {
        const data = await response.json();
        setTemplates(data);
        // Auto-select first template if available
        if (data.length > 0 && !selectedTemplateId) {
          setSelectedTemplateId(data[0].id);
        }
      } else {
        console.error("Failed to fetch templates");
      }
    } catch (error) {
      console.error("Error fetching templates:", error);
    } finally {
      setLoadingTemplates(false);
    }
  }

  async function handleConfirm() {
    if (!selectedTemplateId) {
      alert("Please select a template");
      return;
    }
    if (!signerName.trim()) {
      alert("Please enter signer name");
      return;
    }
    if (!signerEmail.trim() || !signerEmail.includes("@")) {
      alert("Please enter a valid signer email");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `/api/recruits/${recruitId}/send-agreement`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            templateId: selectedTemplateId,
            signerName: signerName.trim(),
            signerEmail: signerEmail.trim(),
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || "Failed to send agreement");
        return;
      }

      alert("Agreement sent successfully!");
      onClose();
      router.refresh();
    } catch (error) {
      console.error("Error sending agreement:", error);
      alert("Failed to send agreement");
    } finally {
      setLoading(false);
    }
  }

  if (!recruit) {
    return null;
  }

  const { recruit: r, targetOffice, targetRole, targetPayPlan, recruiter } =
    recruit;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Send Agreement</DialogTitle>
          <DialogDescription>
            Send employment agreement via SignNow for signature.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
            <div>
              <span className="font-medium">Recruit:</span> {r.firstName}{" "}
              {r.lastName}
            </div>
            <div>
              <span className="font-medium">Target Office:</span>{" "}
              {targetOffice?.name || "N/A"}
            </div>
            <div>
              <span className="font-medium">Target Role:</span>{" "}
              {targetRole?.name || "N/A"}
            </div>
            <div>
              <span className="font-medium">Target Pay Plan:</span>{" "}
              {targetPayPlan?.name || "N/A"}
            </div>
            <div>
              <span className="font-medium">Recruiter:</span>{" "}
              {recruiter
                ? `${recruiter.firstName} ${recruiter.lastName}`
                : "N/A"}
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="template">Template *</Label>
              <Select
                value={selectedTemplateId}
                onValueChange={setSelectedTemplateId}
                disabled={loadingTemplates}
              >
                <SelectTrigger id="template">
                  <SelectValue placeholder={loadingTemplates ? "Loading templates..." : "Select a template"} />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="signerName">Signer Name *</Label>
              <Input
                id="signerName"
                value={signerName}
                onChange={(e) => setSignerName(e.target.value)}
                placeholder="Enter signer name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="signerEmail">Signer Email *</Label>
              <Input
                id="signerEmail"
                type="email"
                value={signerEmail}
                onChange={(e) => setSignerEmail(e.target.value)}
                placeholder="Enter signer email"
              />
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-900">
            <p>
              This will create a document from the selected SignNow template, pre-fill it
              with the recruit's information, and send it to{" "}
              <strong>{signerEmail || "the signer"}</strong> for signature. The recruit's status will
              be updated to "Agreement Sent".
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" onClick={handleConfirm} disabled={loading}>
            {loading ? "Sending..." : "Send Agreement"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
