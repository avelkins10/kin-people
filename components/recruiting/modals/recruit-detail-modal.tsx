"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Pencil } from "lucide-react";
import { SendDocumentModal } from "@/components/documents/send-document-modal";
import { DocumentList } from "@/components/documents/document-list";
import { ConvertToPersonModal } from "./convert-to-person-modal";
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/use-toast";
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
import type { RecruitWithDetails } from "@/types/recruiting";

interface RecruitDetailModalProps {
  recruitId: string;
  open: boolean;
  onClose: () => void;
  /** When true, open the Send Document modal as soon as this modal opens (e.g. from kanban "Send agreement" confirm). */
  openSendDocumentOnOpen?: boolean;
}

export function RecruitDetailModal({
  recruitId,
  open,
  onClose,
  openSendDocumentOnOpen,
}: RecruitDetailModalProps) {
  const [recruit, setRecruit] = useState<RecruitWithDetails | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showSendDocument, setShowSendDocument] = useState(false);
  const [resendDocument, setResendDocument] = useState<{ documentId: string; documentType: string } | null>(null);
  const [showConvert, setShowConvert] = useState(false);
  const [showSendAgreementConfirm, setShowSendAgreementConfirm] = useState(false);
  const [showAgreementOverride, setShowAgreementOverride] = useState(false);
  const [overrideStatusPreset, setOverrideStatusPreset] = useState<"agreement_sent" | "agreement_signed" | null>(null);
  const [canOverrideAgreement, setCanOverrideAgreement] = useState(false);
  const [overrideFormStatus, setOverrideFormStatus] = useState<"agreement_sent" | "agreement_signed">("agreement_sent");
  const [overrideSentAt, setOverrideSentAt] = useState("");
  const [overrideSignedAt, setOverrideSignedAt] = useState("");
  const [overrideFile, setOverrideFile] = useState<File | null>(null);
  const [overrideSubmitting, setOverrideSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [offices, setOffices] = useState<Array<{ id: string; name: string }>>([]);
  const [teams, setTeams] = useState<Array<{ id: string; name: string }>>([]);
  const [managers, setManagers] = useState<Array<{ id: string; firstName: string; lastName: string }>>([]);
  const [roles, setRoles] = useState<Array<{ id: string; name: string }>>([]);
  const [payPlans, setPayPlans] = useState<Array<{ id: string; name: string }>>([]);
  const [editForm, setEditForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    source: "",
    priority: "" as "" | "high" | "medium" | "low",
    targetOfficeId: "",
    targetTeamId: "",
    targetReportsToId: "",
    targetRoleId: "",
    targetPayPlanId: "",
    notes: "",
  });
  const router = useRouter();

  useEffect(() => {
    if (open && recruitId) {
      fetchRecruit();
      fetchHistory();
    }
  }, [open, recruitId]);

  useEffect(() => {
    if (!open) return;
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { permissions?: string[] } | null) => {
        const perms = data?.permissions ?? [];
        setCanOverrideAgreement(
          Array.isArray(perms) && perms.includes("MANAGE_SETTINGS")
        );
      })
      .catch(() => setCanOverrideAgreement(false));
  }, [open]);

  useEffect(() => {
    if (open && openSendDocumentOnOpen) {
      setShowSendDocument(true);
    }
  }, [open, openSendDocumentOnOpen]);

  useEffect(() => {
    if (showAgreementOverride && overrideStatusPreset) {
      setOverrideFormStatus(overrideStatusPreset);
    }
  }, [showAgreementOverride, overrideStatusPreset]);

  async function fetchRecruit() {
    try {
      const response = await fetch(`/api/recruits/${recruitId}`);
      if (response.ok) {
        const data = await response.json();
        setRecruit(data);
      }
    } catch (error) {
      console.error("Error fetching recruit:", error);
    }
  }

  async function fetchHistory() {
    try {
      const response = await fetch(`/api/recruits/${recruitId}/history`);
      if (response.ok) {
        const data = await response.json();
        setHistory(data);
      }
    } catch (error) {
      console.error("Error fetching history:", error);
    }
  }

  const fetchEditOptions = useCallback(async () => {
    try {
      const [officesRes, teamsRes, managersRes, rolesRes, payPlansRes] = await Promise.all([
        fetch("/api/offices?active=true"),
        fetch("/api/teams?active=true"),
        fetch("/api/people?roleLevel=manager"),
        fetch("/api/roles?active=true"),
        fetch("/api/pay-plans?active=true"),
      ]);
      if (officesRes.ok) {
        const d = await officesRes.json();
        setOffices(Array.isArray(d) ? d.map((o: { id: string; name: string }) => ({ id: o.id, name: o.name })) : []);
      }
      if (teamsRes.ok) {
        const d = await teamsRes.json();
        setTeams(Array.isArray(d) ? d.map((t: { id: string; name: string }) => ({ id: t.id, name: t.name })) : []);
      }
      if (managersRes.ok) {
        const d = await managersRes.json();
        setManagers(Array.isArray(d) ? d.map((p: { id: string; firstName: string; lastName: string }) => ({ id: p.id, firstName: p.firstName ?? "", lastName: p.lastName ?? "" })) : []);
      }
      if (rolesRes.ok) {
        const d = await rolesRes.json();
        setRoles(Array.isArray(d) ? d.map((r: { id: string; name: string }) => ({ id: r.id, name: r.name })) : []);
      }
      if (payPlansRes.ok) {
        const d = await payPlansRes.json();
        setPayPlans(Array.isArray(d) ? d.map((p: { id: string; name: string }) => ({ id: p.id, name: p.name })) : []);
      }
    } catch (err) {
      console.error("Error fetching edit options:", err);
    }
  }, []);

  function startEditing() {
    try {
      if (!recruit?.recruit) return;
      const r = recruit.recruit;
      const priority = (r as { priority?: string | null }).priority;
      const priorityVal = priority === "high" || priority === "medium" || priority === "low" ? priority : "";
      setEditForm({
        firstName: String(r.firstName ?? ""),
        lastName: String(r.lastName ?? ""),
        email: String(r.email ?? ""),
        phone: String(r.phone ?? ""),
        source: String(r.source ?? ""),
        priority: priorityVal,
        targetOfficeId: recruit.targetOffice?.id ?? "",
        targetTeamId: recruit.targetTeam?.id ?? "",
        targetReportsToId: r.targetReportsToId ?? recruit.targetReportsTo?.id ?? "",
        targetRoleId: recruit.targetRole?.id ?? "",
        targetPayPlanId: recruit.targetPayPlan?.id ?? "",
        notes: String(r.notes ?? ""),
      });
      fetchEditOptions();
      setIsEditing(true);
    } catch (err) {
      console.error("Error starting edit:", err);
      alert("Something went wrong. Please try again.");
    }
  }

  async function handleSaveEdit() {
    if (!recruit) return;
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        firstName: editForm.firstName.trim(),
        lastName: editForm.lastName.trim(),
        email: editForm.email.trim() || undefined,
        phone: editForm.phone.trim() || undefined,
        source: editForm.source.trim() || undefined,
        priority: editForm.priority || null,
        targetOfficeId: editForm.targetOfficeId || undefined,
        targetTeamId: editForm.targetTeamId || undefined,
        targetReportsToId: editForm.targetReportsToId || undefined,
        targetRoleId: editForm.targetRoleId || undefined,
        targetPayPlanId: editForm.targetPayPlanId || undefined,
        notes: editForm.notes.trim() || undefined,
      };
      const res = await fetch(`/api/recruits/${recruitId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error || "Failed to update");
      }
      await fetchRecruit();
      await fetchHistory();
      window.dispatchEvent(new CustomEvent("recruits-updated"));
      setIsEditing(false);
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to update recruit");
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(newStatus: string) {
    // Agreement Sent: do not call API; show confirm and open Send Document on confirm
    if (newStatus === "agreement_sent") {
      setShowSendAgreementConfirm(true);
      return;
    }
    // Agreement Signed: do not call API; show override modal for admin, toast for others
    if (newStatus === "agreement_signed") {
      if (canOverrideAgreement) {
        setOverrideStatusPreset("agreement_signed");
        setShowAgreementOverride(true);
      } else {
        toast({
          title: "Agreement Signed is automatic",
          description:
            "Agreement Signed is set automatically when the rep agreement is fully signed. Admins can use Override agreement status to set it manually.",
        });
      }
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/recruits/${recruitId}/update-status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newStatus }),
      });

      if (response.ok) {
        await fetchRecruit();
        await fetchHistory();
        window.dispatchEvent(new CustomEvent("recruits-updated"));
        router.refresh();
      } else {
        const data = await response.json().catch(() => ({}));
        alert((data as { error?: string }).error ?? "Failed to update status");
      }
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Failed to update status");
    } finally {
      setLoading(false);
    }
  }

  function handleSendDocumentClose() {
    setShowSendDocument(false);
    fetchRecruit();
    router.refresh();
    window.dispatchEvent(new CustomEvent("documents-updated"));
  }

  function openAgreementOverrideModal() {
    setOverrideStatusPreset(null);
    setOverrideFormStatus("agreement_sent");
    setOverrideSentAt("");
    setOverrideSignedAt("");
    setOverrideFile(null);
    setShowAgreementOverride(true);
  }

  function closeAgreementOverrideModal() {
    setShowAgreementOverride(false);
    setOverrideStatusPreset(null);
    setOverrideFormStatus("agreement_sent");
    setOverrideSentAt("");
    setOverrideSignedAt("");
    setOverrideFile(null);
  }

  async function handleAgreementOverrideSubmit(e: React.FormEvent) {
    e.preventDefault();
    const status = overrideStatusPreset ?? overrideFormStatus;
    const sentAt = overrideSentAt || (overrideStatusPreset ? undefined : undefined);
    if (!sentAt) {
      alert("Agreement sent date is required.");
      return;
    }
    if (status === "agreement_signed" && !overrideSignedAt) {
      alert("Agreement signed date is required for Agreement Signed.");
      return;
    }
    setOverrideSubmitting(true);
    try {
      const formData = new FormData();
      formData.set("status", status);
      formData.set("agreementSentAt", new Date(overrideSentAt).toISOString());
      if (status === "agreement_signed" && overrideSignedAt) {
        formData.set("agreementSignedAt", new Date(overrideSignedAt).toISOString());
      }
      if (overrideFile) {
        formData.set("file", overrideFile);
      }
      const res = await fetch(`/api/recruits/${recruitId}/agreement-override`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error ?? "Failed to override");
      }
      await fetchRecruit();
      await fetchHistory();
      closeAgreementOverrideModal();
      window.dispatchEvent(new CustomEvent("recruits-updated"));
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to override agreement status");
    } finally {
      setOverrideSubmitting(false);
    }
  }

  if (!recruit) {
    return null;
  }

  const { recruit: r, targetOffice, targetRole, targetPayPlan, recruiter } =
    recruit;

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {r.firstName} {r.lastName}
            </DialogTitle>
            <DialogDescription>Recruit Details</DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {isEditing ? (
              /* Edit form */
              <>
                <div>
                  <h3 className="font-semibold mb-3">Edit recruit</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="edit-firstName">First Name</Label>
                      <Input
                        id="edit-firstName"
                        value={editForm.firstName}
                        onChange={(e) => setEditForm((f) => ({ ...f, firstName: e.target.value }))}
                        required
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-lastName">Last Name</Label>
                      <Input
                        id="edit-lastName"
                        value={editForm.lastName}
                        onChange={(e) => setEditForm((f) => ({ ...f, lastName: e.target.value }))}
                        required
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-email">Email</Label>
                      <Input
                        id="edit-email"
                        type="email"
                        value={editForm.email}
                        onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-phone">Phone</Label>
                      <Input
                        id="edit-phone"
                        value={editForm.phone}
                        onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))}
                        className="mt-1"
                      />
                    </div>
                    <div className="col-span-2">
                      <Label htmlFor="edit-source">Source</Label>
                      <Input
                        id="edit-source"
                        value={editForm.source}
                        onChange={(e) => setEditForm((f) => ({ ...f, source: e.target.value }))}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-priority">Priority</Label>
                      <Select
                        value={editForm.priority === "high" || editForm.priority === "medium" || editForm.priority === "low" ? editForm.priority : "none"}
                        onValueChange={(v) => setEditForm((f) => ({ ...f, priority: v === "none" ? "" : (v as "high" | "medium" | "low") }))}
                      >
                        <SelectTrigger id="edit-priority" className="mt-1">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="low">Low</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="edit-office">Target Office</Label>
                      <Select
                        value={offices.some((o) => o.id === editForm.targetOfficeId) ? editForm.targetOfficeId : undefined}
                        onValueChange={(v) => setEditForm((f) => ({ ...f, targetOfficeId: v }))}
                      >
                        <SelectTrigger id="edit-office" className="mt-1">
                          <SelectValue placeholder="Select office" />
                        </SelectTrigger>
                        <SelectContent>
                          {offices.map((o) => (
                            <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="edit-team">Target Team</Label>
                      <Select
                        value={teams.some((t) => t.id === editForm.targetTeamId) ? editForm.targetTeamId : undefined}
                        onValueChange={(v) => setEditForm((f) => ({ ...f, targetTeamId: v }))}
                      >
                        <SelectTrigger id="edit-team" className="mt-1">
                          <SelectValue placeholder="Select team" />
                        </SelectTrigger>
                        <SelectContent>
                          {teams.map((t) => (
                            <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="edit-reportsTo">Reports To</Label>
                      <Select
                        value={managers.some((m) => m.id === editForm.targetReportsToId) ? editForm.targetReportsToId : undefined}
                        onValueChange={(v) => setEditForm((f) => ({ ...f, targetReportsToId: v }))}
                      >
                        <SelectTrigger id="edit-reportsTo" className="mt-1">
                          <SelectValue placeholder="Select manager" />
                        </SelectTrigger>
                        <SelectContent>
                          {managers.map((m) => (
                            <SelectItem key={m.id} value={m.id}>{m.firstName} {m.lastName}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="edit-role">Target Role</Label>
                      <Select
                        value={roles.some((role) => role.id === editForm.targetRoleId) ? editForm.targetRoleId : undefined}
                        onValueChange={(v) => setEditForm((f) => ({ ...f, targetRoleId: v }))}
                      >
                        <SelectTrigger id="edit-role" className="mt-1">
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          {roles.map((role) => (
                            <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="edit-payPlan">Target Pay Plan</Label>
                      <Select
                        value={payPlans.some((p) => p.id === editForm.targetPayPlanId) ? editForm.targetPayPlanId : undefined}
                        onValueChange={(v) => setEditForm((f) => ({ ...f, targetPayPlanId: v }))}
                      >
                        <SelectTrigger id="edit-payPlan" className="mt-1">
                          <SelectValue placeholder="Select pay plan" />
                        </SelectTrigger>
                        <SelectContent>
                          {payPlans.map((p) => (
                            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-2">
                      <Label htmlFor="edit-notes">Notes</Label>
                      <Textarea
                        id="edit-notes"
                        value={editForm.notes}
                        onChange={(e) => setEditForm((f) => ({ ...f, notes: e.target.value }))}
                        className="mt-1 min-h-[80px]"
                        placeholder="Optional notes"
                      />
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Basic Info */}
                <div>
                  <h3 className="font-semibold mb-3">Basic Information</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Email:</span>{" "}
                      {r.email || "-"}
                    </div>
                    <div>
                      <span className="text-gray-600">Phone:</span> {r.phone || "-"}
                    </div>
                    <div>
                      <span className="text-gray-600">Source:</span> {r.source || "-"}
                    </div>
                    <div>
                      <span className="text-gray-600">Status:</span>{" "}
                      <Badge>{r.status}</Badge>
                    </div>
                    <div>
                      <span className="text-gray-600">Recruiter:</span>{" "}
                      {recruiter
                        ? `${recruiter.firstName} ${recruiter.lastName}`
                        : "-"}
                    </div>
                    <div>
                      <span className="text-gray-600">Created:</span>{" "}
                      {r.createdAt
                        ? new Date(r.createdAt).toLocaleDateString()
                        : "-"}
                    </div>
                  </div>
                </div>

                {/* Target Assignments */}
                <div>
                  <h3 className="font-semibold mb-3">Target Assignments</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Office:</span>{" "}
                      {targetOffice?.name || "-"}
                    </div>
                    <div>
                      <span className="text-gray-600">Role:</span>{" "}
                      {targetRole?.name || "-"}
                    </div>
                    <div>
                      <span className="text-gray-600">Pay Plan:</span>{" "}
                      {targetPayPlan?.name || "-"}
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Documents */}
            <div>
              <h3 className="font-semibold mb-3">Documents</h3>
              <DocumentList
                entityType="recruit"
                entityId={recruitId}
                onResendClick={(item) =>
                  setResendDocument({
                    documentId: item.document.id,
                    documentType: item.document.documentType,
                  })
                }
              />
            </div>

            {/* Notes */}
            {r.notes && (
              <div>
                <h3 className="font-semibold mb-3">Notes</h3>
                <p className="text-sm text-gray-700">{r.notes}</p>
              </div>
            )}

            {/* History */}
            <div>
              <h3 className="font-semibold mb-3">History</h3>
              <div className="space-y-2">
                {history.map((item, idx) => (
                  <div key={idx} className="text-sm border-l-2 pl-3 py-1">
                    <div className="font-medium">
                      {item.history.previousStatus || "Created"} → {item.history.newStatus}
                    </div>
                    <div className="text-gray-600 text-xs">
                      {item.history.createdAt
                        ? new Date(item.history.createdAt).toLocaleString()
                        : ""}
                      {item.changedBy &&
                        ` by ${item.changedBy.firstName} ${item.changedBy.lastName}`}
                    </div>
                    {item.history.notes && (
                      <div className="text-gray-600 text-xs mt-1">
                        {item.history.notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div>
              <h3 className="font-semibold mb-3">Actions</h3>
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => setShowSendDocument(true)}>
                  Send Rep Agreement
                </Button>
                {r.status === "agreement_signed" && (
                  <Button onClick={() => setShowConvert(true)}>
                    Convert to Person
                  </Button>
                )}
                {canOverrideAgreement && (
                  <Button variant="outline" onClick={openAgreementOverrideModal}>
                    Override agreement status
                  </Button>
                )}
                <div className="flex items-center gap-2">
                  <span className="text-sm">Update Status:</span>
                  <Select
                    value={r.status ?? undefined}
                    onValueChange={handleStatusChange}
                    disabled={loading}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lead">Lead</SelectItem>
                      <SelectItem value="contacted">Contacted</SelectItem>
                      <SelectItem value="interviewing">Interviewing</SelectItem>
                      <SelectItem value="offer_sent">Offer Sent</SelectItem>
                      <SelectItem value="agreement_sent">
                        Agreement Sent
                      </SelectItem>
                      <SelectItem value="agreement_signed">
                        Agreement Signed
                      </SelectItem>
                      <SelectItem value="onboarding">Onboarding</SelectItem>
                      <SelectItem value="converted">Converted</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                      <SelectItem value="dropped">Dropped</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            {isEditing ? (
              <>
                <Button variant="outline" onClick={() => setIsEditing(false)} disabled={saving}>
                  Cancel
                </Button>
                <Button onClick={handleSaveEdit} disabled={saving}>
                  {saving ? "Saving…" : "Save"}
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={onClose}>
                  Close
                </Button>
                <Button variant="outline" onClick={startEditing}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {showSendAgreementConfirm && (
        <AlertDialog
          open={showSendAgreementConfirm}
          onOpenChange={(open) => !open && setShowSendAgreementConfirm(false)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Send rep agreement?</AlertDialogTitle>
              <AlertDialogDescription>
                Do you want to send this recruit a rep agreement? The recruit
                will move to Agreement Sent once the document is sent.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  setShowSendAgreementConfirm(false);
                  setShowSendDocument(true);
                }}
              >
                Send agreement
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {showAgreementOverride && recruit && (
        <Dialog open={showAgreementOverride} onOpenChange={(open) => !open && closeAgreementOverrideModal()}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Override agreement status</DialogTitle>
              <DialogDescription>
                Set agreement status manually and optionally upload a PDF. Only admins can override.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAgreementOverrideSubmit} className="space-y-4">
              <div>
                <Label>Status</Label>
                {overrideStatusPreset ? (
                  <p className="text-sm font-medium mt-1">
                    {overrideStatusPreset === "agreement_sent" ? "Agreement Sent" : "Agreement Signed"}
                  </p>
                ) : (
                  <Select
                    value={overrideFormStatus}
                    onValueChange={(v) => setOverrideFormStatus(v as "agreement_sent" | "agreement_signed")}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="agreement_sent">Agreement Sent</SelectItem>
                      <SelectItem value="agreement_signed">Agreement Signed</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
              <div>
                <Label htmlFor="override-sent-at">Agreement sent date</Label>
                <Input
                  id="override-sent-at"
                  type="date"
                  value={overrideSentAt}
                  onChange={(e) => setOverrideSentAt(e.target.value)}
                  required
                  className="mt-1"
                />
              </div>
              {(overrideStatusPreset ?? overrideFormStatus) === "agreement_signed" && (
                <div>
                  <Label htmlFor="override-signed-at">Agreement signed date</Label>
                  <Input
                    id="override-signed-at"
                    type="date"
                    value={overrideSignedAt}
                    onChange={(e) => setOverrideSignedAt(e.target.value)}
                    required
                    className="mt-1"
                  />
                </div>
              )}
              <div>
                <Label htmlFor="override-file">Upload PDF (optional)</Label>
                <Input
                  id="override-file"
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => setOverrideFile(e.target.files?.[0] ?? null)}
                  className="mt-1"
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={closeAgreementOverrideModal} disabled={overrideSubmitting}>
                  Cancel
                </Button>
                <Button type="submit" disabled={overrideSubmitting}>
                  {overrideSubmitting ? "Saving…" : "Save override"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {showSendDocument && (
        <SendDocumentModal
          entityType="recruit"
          entityId={recruitId}
          documentType="rep_agreement"
          open={showSendDocument}
          onClose={handleSendDocumentClose}
        />
      )}

      {resendDocument && (
        <SendDocumentModal
          entityType="recruit"
          entityId={recruitId}
          documentType={resendDocument.documentType}
          open={true}
          onClose={() => setResendDocument(null)}
          resendDocumentId={resendDocument.documentId}
        />
      )}

      {showConvert && (
        <ConvertToPersonModal
          recruitId={recruitId}
          open={showConvert}
          onClose={() => {
            setShowConvert(false);
            fetchRecruit();
            router.refresh();
          }}
        />
      )}
    </>
  );
}
