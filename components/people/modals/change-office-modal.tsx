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

interface ChangeOfficeModalProps {
  personId: string;
  open: boolean;
  onClose: () => void;
}

export function ChangeOfficeModal({ personId, open, onClose }: ChangeOfficeModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [offices, setOffices] = useState<Array<{ id: string; name: string }>>([]);
  const [currentOffice, setCurrentOffice] = useState<string>("");
  const [formData, setFormData] = useState({
    newOfficeId: "",
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
      const [personRes, officesRes] = await Promise.all([
        fetch(`/api/people/${personId}`),
        fetch("/api/offices?active=true"),
      ]);

      if (personRes.ok) {
        const personData = await personRes.json();
        setCurrentOffice(personData.office?.name || "");
      }

      if (officesRes.ok) {
        const officesData = await officesRes.json();
        setOffices(officesData);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`/api/people/${personId}/change-office`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newOfficeId: formData.newOfficeId,
          effectiveDate: formData.effectiveDate,
          reason: formData.reason,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || "Failed to change office");
        return;
      }

      router.refresh();
      onClose();
    } catch (error) {
      console.error("Error changing office:", error);
      alert("Failed to change office");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Change Office</DialogTitle>
          <DialogDescription>
            Update the person's office assignment.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div>
              <Label>Current Office</Label>
              <Input value={currentOffice} disabled />
            </div>
            <div>
              <Label htmlFor="newOfficeId">New Office *</Label>
              <Select
                value={formData.newOfficeId}
                onValueChange={(value) =>
                  setFormData({ ...formData, newOfficeId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select an office" />
                </SelectTrigger>
                <SelectContent>
                  {offices.map((office) => (
                    <SelectItem key={office.id} value={office.id}>
                      {office.name}
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
