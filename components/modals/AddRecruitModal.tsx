"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

interface AddRecruitModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddRecruitModal({ isOpen, onClose }: AddRecruitModalProps) {
  const [loading, setLoading] = useState(false);
  const [offices, setOffices] = useState<Array<{ id: string; name: string }>>([]);
  const [teams, setTeams] = useState<Array<{ id: string; name: string }>>([]);
  const [managers, setManagers] = useState<
    Array<{ id: string; firstName: string; lastName: string }>
  >([]);
  const [roles, setRoles] = useState<Array<{ id: string; name: string }>>([]);
  const [payPlans, setPayPlans] = useState<Array<{ id: string; name: string }>>([]);

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

  function buildPayload() {
    return {
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      email: formData.email.trim() || undefined,
      phone: formData.phone.trim() || undefined,
      source: formData.source.trim() || undefined,
      targetOfficeId: formData.targetOfficeId || undefined,
      targetTeamId: formData.targetTeamId || undefined,
      targetReportsToId: formData.targetReportsToId || undefined,
      targetRoleId: formData.targetRoleId || undefined,
      targetPayPlanId: formData.targetPayPlanId || undefined,
    };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/recruits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload()),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        alert(data.error || "Failed to create recruit");
        return;
      }

      window.dispatchEvent(new CustomEvent("recruits-updated"));
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
      onClose();
    } catch (error) {
      console.error("Error creating recruit:", error);
      alert("Failed to create recruit");
    } finally {
      setLoading(false);
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
            disabled={loading}
          >
            {loading ? "Creating…" : "Create Recruit"}
          </Button>
        </>
      }
    >
      <form
        id="add-recruit-form"
        onSubmit={handleSubmit}
        className="space-y-4 max-w-2xl"
      >
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
            placeholder="e.g., LinkedIn, Referral"
          />
        </div>
        <div className="border-t pt-4">
          <h3 className="font-semibold mb-4 text-sm">Target Assignments</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="targetOfficeId">Target Office</Label>
              <Select
                value={formData.targetOfficeId || undefined}
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
                value={formData.targetTeamId || undefined}
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
              <Label htmlFor="targetReportsToId">Manager / Reports To</Label>
              <Select
                value={formData.targetReportsToId || undefined}
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
                value={formData.targetRoleId || undefined}
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
                value={formData.targetPayPlanId || undefined}
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
      </form>
    </Modal>
  );
}
