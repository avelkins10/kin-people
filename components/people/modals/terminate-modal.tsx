"use client";

import { useState } from "react";
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
import { useRouter } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface TerminateModalProps {
  personId: string;
  open: boolean;
  onClose: () => void;
}

export function TerminateModal({ personId, open, onClose }: TerminateModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    terminationDate: new Date().toISOString().split("T")[0],
    reason: "",
    confirmed: false,
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!formData.confirmed) {
      toast({
        title: "Error",
        description: "Please confirm the termination",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/people/${personId}/terminate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          terminationDate: formData.terminationDate,
          reason: formData.reason,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to terminate person",
          variant: "destructive",
        });
        return;
      }

      router.refresh();
      onClose();
    } catch (error) {
      console.error("Error terminating person:", error);
      toast({
        title: "Error",
        description: "Failed to terminate person",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Terminate Person
          </DialogTitle>
          <DialogDescription>
            This action will mark the person as terminated and end all active assignments.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="rounded-lg bg-red-50 p-4 text-sm text-red-800">
              <p className="font-medium">Warning:</p>
              <p>This will terminate the person, end all active pay plans and team memberships, and cannot be easily undone.</p>
            </div>
            <div>
              <Label htmlFor="terminationDate">Termination Date *</Label>
              <Input
                id="terminationDate"
                type="date"
                value={formData.terminationDate}
                onChange={(e) =>
                  setFormData({ ...formData, terminationDate: e.target.value })
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="reason">Reason *</Label>
              <Textarea
                id="reason"
                value={formData.reason}
                onChange={(e) =>
                  setFormData({ ...formData, reason: e.target.value })
                }
                placeholder="Explain the reason for termination..."
                required
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="confirmed"
                checked={formData.confirmed}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, confirmed: checked as boolean })
                }
              />
              <Label htmlFor="confirmed" className="cursor-pointer">
                I confirm this termination
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !formData.confirmed} variant="destructive">
              {loading ? "Terminating..." : "Terminate"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
