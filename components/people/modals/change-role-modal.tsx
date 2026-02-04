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
import { Checkbox } from "@/components/ui/checkbox";
import { useRouter } from "next/navigation";
import { toast } from "@/hooks/use-toast";

interface ChangeRoleModalProps {
  personId: string;
  open: boolean;
  onClose: () => void;
}

export function ChangeRoleModal({ personId, open, onClose }: ChangeRoleModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState<Array<{ id: string; name: string }>>([]);
  const [payPlans, setPayPlans] = useState<Array<{ id: string; name: string }>>([]);
  const [currentRole, setCurrentRole] = useState<string>("");
  const [formData, setFormData] = useState({
    newRoleId: "",
    effectiveDate: new Date().toISOString().split("T")[0],
    reason: "",
    updatePayPlan: false,
    newPayPlanId: "",
  });

  useEffect(() => {
    if (open) {
      fetchData();
    }
  }, [open]);

  async function fetchData() {
    try {
      const [personRes, rolesRes, payPlansRes] = await Promise.all([
        fetch(`/api/people/${personId}`),
        fetch("/api/roles?active=true"),
        fetch("/api/pay-plans?active=true"),
      ]);

      if (personRes.ok) {
        const personData = await personRes.json();
        setCurrentRole(personData.role?.name || "");
      }

      if (rolesRes.ok) {
        const rolesData = await rolesRes.json();
        setRoles(rolesData);
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
      const response = await fetch(`/api/people/${personId}/change-role`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newRoleId: formData.newRoleId,
          effectiveDate: formData.effectiveDate,
          reason: formData.reason,
          updatePayPlan: formData.updatePayPlan,
          newPayPlanId: formData.updatePayPlan ? formData.newPayPlanId : undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to change role",
          variant: "destructive",
        });
        return;
      }

      router.refresh();
      onClose();
    } catch (error) {
      console.error("Error changing role:", error);
      toast({
        title: "Error",
        description: "Failed to change role",
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
          <DialogTitle>Change Role</DialogTitle>
          <DialogDescription>
            Update the person's role and optionally their pay plan.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div>
              <Label>Current Role</Label>
              <Input value={currentRole} disabled />
            </div>
            <div>
              <Label htmlFor="newRoleId">New Role *</Label>
              <Select
                value={formData.newRoleId}
                onValueChange={(value) =>
                  setFormData({ ...formData, newRoleId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.name}
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
            <div className="flex items-center space-x-2">
              <Checkbox
                id="updatePayPlan"
                checked={formData.updatePayPlan}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, updatePayPlan: checked as boolean })
                }
              />
              <Label htmlFor="updatePayPlan" className="cursor-pointer">
                Also update pay plan?
              </Label>
            </div>
            {formData.updatePayPlan && (
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
            )}
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
