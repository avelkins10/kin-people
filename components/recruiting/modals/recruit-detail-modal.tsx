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
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SendAgreementModal } from "./send-agreement-modal";
import { ConvertToPersonModal } from "./convert-to-person-modal";
import { useRouter } from "next/navigation";
import type { RecruitWithDetails } from "@/types/recruiting";

interface RecruitDetailModalProps {
  recruitId: string;
  open: boolean;
  onClose: () => void;
}

export function RecruitDetailModal({
  recruitId,
  open,
  onClose,
}: RecruitDetailModalProps) {
  const [recruit, setRecruit] = useState<RecruitWithDetails | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSendAgreement, setShowSendAgreement] = useState(false);
  const [showConvert, setShowConvert] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (open && recruitId) {
      fetchRecruit();
      fetchHistory();
    }
  }, [open, recruitId]);

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

  async function handleStatusChange(newStatus: string) {
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
        router.refresh();
      } else {
        alert("Failed to update status");
      }
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Failed to update status");
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

            {/* Agreement Info */}
            {r.agreementSentAt && (
              <div>
                <h3 className="font-semibold mb-3">Agreement</h3>
                <div className="text-sm space-y-2">
                  <div>
                    <span className="text-gray-600">Sent:</span>{" "}
                    {new Date(r.agreementSentAt).toLocaleDateString()}
                  </div>
                  {r.agreementSignedAt && (
                    <div>
                      <span className="text-gray-600">Signed:</span>{" "}
                      {new Date(r.agreementSignedAt).toLocaleDateString()}
                    </div>
                  )}
                  {r.agreementDocumentUrl && (
                    <div>
                      <a
                        href={r.agreementDocumentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        View Document
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}

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
                {r.status === "offer_sent" && (
                  <Button onClick={() => setShowSendAgreement(true)}>
                    Send Agreement
                  </Button>
                )}
                {r.status === "agreement_signed" && (
                  <Button onClick={() => setShowConvert(true)}>
                    Convert to Person
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
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {showSendAgreement && (
        <SendAgreementModal
          recruitId={recruitId}
          open={showSendAgreement}
          onClose={() => {
            setShowSendAgreement(false);
            fetchRecruit();
            router.refresh();
          }}
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
