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
import { toast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { recruitFormSchema, type RecruitFormData } from "@/lib/validation/recruit-form";

interface AddRecruitModalProps {
  children: React.ReactNode;
}

export function AddRecruitModal({ children }: AddRecruitModalProps) {
  const [open, setOpen] = useState(false);
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

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<RecruitFormData>({
    resolver: zodResolver(recruitFormSchema),
    defaultValues: {
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
    },
  });

  const targetOfficeId = watch("targetOfficeId");
  const targetTeamId = watch("targetTeamId");
  const targetReportsToId = watch("targetReportsToId");
  const targetRoleId = watch("targetRoleId");
  const targetPayPlanId = watch("targetPayPlanId");

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

  async function onSubmit(data: RecruitFormData) {
    try {
      const response = await fetch("/api/recruits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to create recruit",
          variant: "destructive",
        });
        return;
      }

      router.refresh();
      setOpen(false);
      reset();
    } catch (error) {
      console.error("Error creating recruit:", error);
      toast({
        title: "Error",
        description: "Failed to create recruit",
        variant: "destructive",
      });
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
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    {...register("firstName")}
                  />
                  {errors.firstName && (
                    <p className="text-sm text-destructive mt-1">
                      {errors.firstName.message}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    {...register("lastName")}
                  />
                  {errors.lastName && (
                    <p className="text-sm text-destructive mt-1">
                      {errors.lastName.message}
                    </p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    {...register("email")}
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive mt-1">
                      {errors.email.message}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    {...register("phone")}
                  />
                  {errors.phone && (
                    <p className="text-sm text-destructive mt-1">
                      {errors.phone.message}
                    </p>
                  )}
                </div>
              </div>
              <div>
                <Label htmlFor="source">Source</Label>
                <Input
                  id="source"
                  {...register("source")}
                  placeholder="e.g., LinkedIn, Referral, etc."
                />
                {errors.source && (
                  <p className="text-sm text-destructive mt-1">
                    {errors.source.message}
                  </p>
                )}
              </div>
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-4">Target Assignments</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="targetOfficeId">Target Office</Label>
                    <Select
                      value={targetOfficeId || ""}
                      onValueChange={(value) =>
                        setValue("targetOfficeId", value)
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
                    {errors.targetOfficeId && (
                      <p className="text-sm text-destructive mt-1">
                        {errors.targetOfficeId.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="targetTeamId">Target Team</Label>
                    <Select
                      value={targetTeamId || ""}
                      onValueChange={(value) =>
                        setValue("targetTeamId", value)
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
                    {errors.targetTeamId && (
                      <p className="text-sm text-destructive mt-1">
                        {errors.targetTeamId.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="targetReportsToId">Manager/Reports To</Label>
                    <Select
                      value={targetReportsToId || ""}
                      onValueChange={(value) =>
                        setValue("targetReportsToId", value)
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
                    {errors.targetReportsToId && (
                      <p className="text-sm text-destructive mt-1">
                        {errors.targetReportsToId.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="targetRoleId">Target Role</Label>
                    <Select
                      value={targetRoleId || ""}
                      onValueChange={(value) =>
                        setValue("targetRoleId", value)
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
                    {errors.targetRoleId && (
                      <p className="text-sm text-destructive mt-1">
                        {errors.targetRoleId.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="targetPayPlanId">Target Pay Plan</Label>
                    <Select
                      value={targetPayPlanId || ""}
                      onValueChange={(value) =>
                        setValue("targetPayPlanId", value)
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
                    {errors.targetPayPlanId && (
                      <p className="text-sm text-destructive mt-1">
                        {errors.targetPayPlanId.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Recruit"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
