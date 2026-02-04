"use client";

import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";

interface CommissionStatusDropdownProps {
  commissionId: string;
  currentStatus: string;
  onStatusUpdate: () => void;
}

export function CommissionStatusDropdown({
  commissionId,
  currentStatus,
  onStatusUpdate,
}: CommissionStatusDropdownProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [statusReason, setStatusReason] = useState("");

  async function handleStatusChange(newStatus: string) {
    // For destructive actions, show confirmation dialog
    if (newStatus === "held" || newStatus === "void") {
      setPendingAction(newStatus);
      setIsDialogOpen(true);
      return;
    }

    // For non-destructive actions, update immediately
    await updateStatus(newStatus, "");
  }

  async function updateStatus(status: string, reason: string) {
    try {
      const response = await fetch(`/api/commissions/${commissionId}/update-status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status,
          statusReason: reason || undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to update status",
          variant: "destructive",
        });
        return;
      }

      setIsDialogOpen(false);
      setStatusReason("");
      setPendingAction(null);
      onStatusUpdate();
    } catch (error) {
      console.error("Error updating commission status:", error);
      toast({
        title: "Error",
        description: "Failed to update commission status",
        variant: "destructive",
      });
    }
  }

  function handleConfirm() {
    if (pendingAction) {
      updateStatus(pendingAction, statusReason);
    }
  }

  // Don't show dropdown if already paid or void
  if (currentStatus === "paid" || currentStatus === "void") {
    return null;
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {currentStatus === "pending" && (
            <DropdownMenuItem onClick={() => handleStatusChange("approved")}>
              Approve
            </DropdownMenuItem>
          )}
          {currentStatus === "approved" && (
            <DropdownMenuItem onClick={() => handleStatusChange("paid")}>
              Mark as Paid
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={() => handleStatusChange("held")}>
            Hold
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleStatusChange("void")}>
            Void
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {pendingAction === "held" ? "Hold Commission" : "Void Commission"}
            </DialogTitle>
            <DialogDescription>
              {pendingAction === "held"
                ? "Please provide a reason for holding this commission."
                : "Please provide a reason for voiding this commission. This action cannot be undone."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="status-reason">Reason</Label>
              <Textarea
                id="status-reason"
                value={statusReason}
                onChange={(e) => setStatusReason(e.target.value)}
                placeholder="Enter reason..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              variant={pendingAction === "void" ? "destructive" : "default"}
              disabled={!statusReason.trim()}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
