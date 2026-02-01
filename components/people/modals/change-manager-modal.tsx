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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";

interface ChangeManagerModalProps {
  personId: string;
  open: boolean;
  onClose: () => void;
}

export function ChangeManagerModal({ personId, open, onClose }: ChangeManagerModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [managers, setManagers] = useState<Array<{ id: string; name: string }>>([]);
  const [currentManager, setCurrentManager] = useState<string>("");
  const [formData, setFormData] = useState({
    newManagerId: "",
    effectiveDate: new Date().toISOString().split("T")[0],
    reason: "",
  });

  useEffect(() => {
    if (open) {
      fetchData();
    }
  }, [open]);

  async function fetchData() {
    try {
      const [personRes, managersRes] = await Promise.all([
        fetch(`/api/people/${personId}`),
        fetch("/api/people?roleLevel=manager"),
      ]);

      if (personRes.ok) {
        const personData = await personRes.json();
        setCurrentManager(
          personData.manager
            ? `${personData.manager.firstName} ${personData.manager.lastName}`
            : "None"
        );
      }

      if (managersRes.ok) {
        const managersData = await managersRes.json();
        setManagers(managersData);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`/api/people/${personId}/change-manager`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newManagerId: formData.newManagerId || null,
          effectiveDate: formData.effectiveDate,
          reason: formData.reason,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || "Failed to change manager");
        return;
      }

      router.refresh();
      onClose();
    } catch (error) {
      console.error("Error changing manager:", error);
      alert("Failed to change manager");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Change Manager</DialogTitle>
          <DialogDescription>
            Update who this person reports to.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div>
              <Label>Current Manager</Label>
              <Input value={currentManager} disabled />
            </div>
            <div>
              <Label htmlFor="newManagerId">New Manager</Label>
              <Select
                value={formData.newManagerId}
                onValueChange={(value) =>
                  setFormData({ ...formData, newManagerId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a manager (or leave empty)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {managers
                    .filter((m) => m.id !== personId)
                    .map((manager) => (
                      <SelectItem key={manager.id} value={manager.id}>
                        {manager.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="effectiveDate">Effective Date *</Label>
              <Input
                id="effectiveDate"
                type="date"
                value={formData.effectiveDate}
                onChange={(e) =>
                  setFormData({ ...formData, effectiveDate: e.target.value })
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
                placeholder="Explain why this change is being made..."
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
