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
import { toast } from "@/hooks/use-toast";

interface ChangePayPlanModalProps {
  personId: string;
  open: boolean;
  onClose: () => void;
}

export function ChangePayPlanModal({ personId, open, onClose }: ChangePayPlanModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [payPlans, setPayPlans] = useState<Array<{ id: string; name: string }>>([]);
  const [currentPayPlan, setCurrentPayPlan] = useState<string>("");
  const [formData, setFormData] = useState({
    newPayPlanId: "",
    effectiveDate: new Date().toISOString().split("T")[0],
    reason: "",
    notes: "",
  });

  useEffect(() => {
    if (open) {
      fetchData();
    }
  }, [open]);

  async function fetchData() {
    try {
      const [personRes, payPlansRes] = await Promise.all([
        fetch(`/api/people/${personId}`),
        fetch("/api/pay-plans?active=true"),
      ]);

      if (personRes.ok) {
        const personData = await personRes.json();
        setCurrentPayPlan(personData.currentPayPlan?.payPlan?.name || "None");
      }

      if (payPlansRes.ok) {
        const payPlansData = await payPlansRes.json();
        setPayPlans(payPlansData);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`/api/people/${personId}/change-pay-plan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newPayPlanId: formData.newPayPlanId,
          effectiveDate: formData.effectiveDate,
          reason: formData.reason,
          notes: formData.notes || undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to change pay plan",
          variant: "destructive",
        });
        return;
      }

      router.refresh();
      onClose();
    } catch (error) {
      console.error("Error changing pay plan:", error);
      toast({
        title: "Error",
        description: "Failed to change pay plan",
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
          <DialogTitle>Change Pay Plan</DialogTitle>
          <DialogDescription>
            Update the person's pay plan assignment.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div>
              <Label>Current Pay Plan</Label>
              <Input value={currentPayPlan} disabled />
            </div>
            <div>
              <Label htmlFor="newPayPlanId">New Pay Plan *</Label>
              <Select
                value={formData.newPayPlanId}
                onValueChange={(value) =>
                  setFormData({ ...formData, newPayPlanId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a pay plan" />
                </SelectTrigger>
                <SelectContent>
                  {payPlans.map((plan) => (
                    <SelectItem key={plan.id} value={plan.id}>
                      {plan.name}
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
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                placeholder="Special deal documentation or notes..."
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
