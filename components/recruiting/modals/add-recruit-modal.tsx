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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter } from "next/navigation";

interface AddRecruitModalProps {
  children: React.ReactNode;
}

export function AddRecruitModal({ children }: AddRecruitModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [offices, setOffices] = useState<Array<{ id: string; name: string }>>(
    []
  );
  const [teams, setTeams] = useState<Array<{ id: string; name: string }>>([]);
  const [managers, setManagers] = useState<
    Array<{ id: string; firstName: string; lastName: string }>
  >([]);
  const [roles, setRoles] = useState<Array<{ id: string; name: string }>>([]);
  const [payPlans, setPayPlans] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const router = useRouter();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    source: "",
    targetOfficeId: "",
    targetTeamId: "",
    targetReportsToId: "",
    targetRoleId: "",
    targetPayPlanId: "",
  });

  useEffect(() => {
    if (open) {
      fetchOptions();
    }
  }, [open]);

  async function fetchOptions() {
    try {
      const [officesRes, teamsRes, managersRes, rolesRes, payPlansRes] =
        await Promise.all([
          fetch("/api/offices?active=true"),
          fetch("/api/teams?active=true"),
          fetch("/api/people?roleLevel=manager"),
          fetch("/api/roles?active=true"),
          fetch("/api/pay-plans?active=true"),
        ]);

      if (officesRes.ok) {
        const data = await officesRes.json();
        setOffices(data);
      }
      if (teamsRes.ok) {
        const data = await teamsRes.json();
        setTeams(data);
      }
      if (managersRes.ok) {
        const data = await managersRes.json();
        setManagers(data);
      }
      if (rolesRes.ok) {
        const data = await rolesRes.json();
        setRoles(data);
      }
      if (payPlansRes.ok) {
        const data = await payPlansRes.json();
        setPayPlans(data);
      }
    } catch (error) {
      console.error("Error fetching options:", error);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/recruits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || "Failed to create recruit");
        return;
      }

      router.refresh();
      setOpen(false);
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        source: "",
        targetOfficeId: "",
        targetTeamId: "",
        targetReportsToId: "",
        targetRoleId: "",
        targetPayPlanId: "",
      });
    } catch (error) {
      console.error("Error creating recruit:", error);
      alert("Failed to create recruit");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div onClick={() => setOpen(true)}>{children}</div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Recruit</DialogTitle>
            <DialogDescription>
              Create a new recruit in the pipeline.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) =>
                      setFormData({ ...formData, firstName: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) =>
                      setFormData({ ...formData, lastName: e.target.value })
                    }
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="source">Source</Label>
                <Input
                  id="source"
                  value={formData.source}
                  onChange={(e) =>
                    setFormData({ ...formData, source: e.target.value })
                  }
                  placeholder="e.g., LinkedIn, Referral, etc."
                />
              </div>
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-4">Target Assignments</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="targetOfficeId">Target Office</Label>
                    <Select
                      value={formData.targetOfficeId}
                      onValueChange={(value) =>
                        setFormData({ ...formData, targetOfficeId: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select office" />
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
                    <Label htmlFor="targetTeamId">Target Team</Label>
                    <Select
                      value={formData.targetTeamId}
                      onValueChange={(value) =>
                        setFormData({ ...formData, targetTeamId: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select team" />
                      </SelectTrigger>
                      <SelectContent>
                        {teams.map((team) => (
                          <SelectItem key={team.id} value={team.id}>
                            {team.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="targetReportsToId">Manager/Reports To</Label>
                    <Select
                      value={formData.targetReportsToId}
                      onValueChange={(value) =>
                        setFormData({ ...formData, targetReportsToId: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select manager" />
                      </SelectTrigger>
                      <SelectContent>
                        {managers.map((manager) => (
                          <SelectItem key={manager.id} value={manager.id}>
                            {manager.firstName} {manager.lastName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="targetRoleId">Target Role</Label>
                    <Select
                      value={formData.targetRoleId}
                      onValueChange={(value) =>
                        setFormData({ ...formData, targetRoleId: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
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
                    <Label htmlFor="targetPayPlanId">Target Pay Plan</Label>
                    <Select
                      value={formData.targetPayPlanId}
                      onValueChange={(value) =>
                        setFormData({ ...formData, targetPayPlanId: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select pay plan" />
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
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Creating..." : "Create Recruit"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
