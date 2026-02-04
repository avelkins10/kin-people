"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { toast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { recruitFormSchema, type RecruitFormData } from "@/lib/validation/recruit-form";

interface AddRecruitModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddRecruitModal({ isOpen, onClose }: AddRecruitModalProps) {
  const [offices, setOffices] = useState<Array<{ id: string; name: string }>>([]);
  const [teams, setTeams] = useState<Array<{ id: string; name: string }>>([]);
  const [managers, setManagers] = useState<
    Array<{ id: string; firstName: string; lastName: string }>
  >([]);
  const [roles, setRoles] = useState<Array<{ id: string; name: string }>>([]);
  const [payPlans, setPayPlans] = useState<Array<{ id: string; name: string }>>([]);

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
    if (isOpen) {
      fetchOptions();
    }
  }, [isOpen]);

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
        setOffices(Array.isArray(data) ? data.map((o: { id: string; name: string }) => ({ id: o.id, name: o.name })) : []);
      }
      if (teamsRes.ok) {
        const data = await teamsRes.json();
        setTeams(Array.isArray(data) ? data.map((t: { id: string; name: string }) => ({ id: t.id, name: t.name })) : []);
      }
      if (managersRes.ok) {
        const data = await managersRes.json();
        setManagers(
          Array.isArray(data)
            ? data.map((p: { id: string; firstName: string; lastName: string }) => ({
                id: p.id,
                firstName: p.firstName ?? "",
                lastName: p.lastName ?? "",
              }))
            : []
        );
      }
      if (rolesRes.ok) {
        const data = await rolesRes.json();
        setRoles(Array.isArray(data) ? data.map((r: { id: string; name: string }) => ({ id: r.id, name: r.name })) : []);
      }
      if (payPlansRes.ok) {
        const data = await payPlansRes.json();
        setPayPlans(Array.isArray(data) ? data.map((p: { id: string; name: string }) => ({ id: p.id, name: p.name })) : []);
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

      const responseData = await response.json().catch(() => ({}));

      if (!response.ok) {
        toast({
          title: "Error",
          description: responseData.error || "Failed to create recruit",
          variant: "destructive",
        });
        return;
      }

      window.dispatchEvent(new CustomEvent("recruits-updated"));
      reset();
      onClose();
    } catch (error) {
      console.error("Error creating recruit:", error);
      toast({
        title: "Error",
        description: "Failed to create recruit",
        variant: "destructive",
      });
    }
  }

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add New Recruit"
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="add-recruit-form"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Creating…" : "Create Recruit"}
          </Button>
        </>
      }
    >
      <form
        id="add-recruit-form"
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-4 max-w-2xl"
      >
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
            placeholder="e.g., LinkedIn, Referral"
          />
          {errors.source && (
            <p className="text-sm text-destructive mt-1">
              {errors.source.message}
            </p>
          )}
        </div>
        <div className="border-t pt-4">
          <h3 className="font-semibold mb-4 text-sm">Target Assignments</h3>
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
              <Label htmlFor="targetReportsToId">Manager / Reports To</Label>
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
      </form>
    </Modal>
  );
}
