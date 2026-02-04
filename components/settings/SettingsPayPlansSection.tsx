"use client";

import React, { useState } from "react";
import { DollarSign, Plus, Edit2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import type { PayPlan } from "@/hooks/use-settings-data";

interface SettingsPayPlansSectionProps {
  payPlans: PayPlan[];
  loading: boolean;
  onRefetch: () => void;
}

export function SettingsPayPlansSection({
  payPlans,
  loading,
  onRefetch,
}: SettingsPayPlansSectionProps) {
  const [addOpen, setAddOpen] = useState(false);
  const [editPlan, setEditPlan] = useState<PayPlan | null>(null);
  const [deletePlan, setDeletePlan] = useState<PayPlan | null>(null);
  const [saving, setSaving] = useState(false);
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");

  const resetForm = () => {
    setFormName("");
    setFormDescription("");
    setEditPlan(null);
  };

  const openAdd = () => {
    resetForm();
    setAddOpen(true);
  };

  const openEdit = (plan: PayPlan) => {
    setEditPlan(plan);
    setFormName(plan.name);
    setFormDescription(plan.description ?? "");
  };

  const handleCreate = async () => {
    if (!formName.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/pay-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName.trim(),
          description: formDescription.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error || "Failed to create");
      }
      setAddOpen(false);
      resetForm();
      onRefetch();
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Error",
        description: e instanceof Error ? e.message : "Failed to create pay plan",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!editPlan || !formName.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/pay-plans/${editPlan.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName.trim(),
          description: formDescription.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error || "Failed to update");
      }
      setEditPlan(null);
      resetForm();
      onRefetch();
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Error",
        description: e instanceof Error ? e.message : "Failed to update pay plan",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletePlan) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/pay-plans/${deletePlan.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error || "Failed to delete");
      }
      setDeletePlan(null);
      onRefetch();
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Error",
        description: e instanceof Error ? e.message : "Failed to delete pay plan",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white border border-gray-100 rounded-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-indigo-600" />
          <h3 className="text-lg font-extrabold uppercase tracking-tight text-black">
            Pay Plans
          </h3>
        </div>
        <Button variant="ghost" size="icon" onClick={openAdd} aria-label="Add pay plan">
          <Plus className="w-4 h-4 text-gray-500" />
        </Button>
      </div>
      <div className="space-y-3">
        {loading ? (
          <p className="text-sm text-gray-500">Loading...</p>
        ) : payPlans.length === 0 ? (
          <p className="text-sm text-gray-500">No pay plans yet. Add one to get started.</p>
        ) : (
          payPlans.map((plan) => (
            <div
              key={plan.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-sm group"
            >
              <div>
                <span className="font-bold text-sm text-gray-700 block">{plan.name}</span>
                <span
                  className={`text-[10px] font-bold uppercase ${plan.isActive ? "text-green-600" : "text-gray-400"}`}
                >
                  {plan.isActive ? "Active" : "Archived"}
                  {plan.rulesCount != null && ` · ${plan.rulesCount} rules`}
                </span>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => openEdit(plan)}
                  aria-label={`Edit ${plan.name}`}
                >
                  <Edit2 className="w-3 h-3 text-indigo-600" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setDeletePlan(plan)}
                  aria-label={`Delete ${plan.name}`}
                >
                  <Trash2 className="w-3 h-3 text-red-600" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add pay plan</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="add-plan-name">Name</Label>
              <Input
                id="add-plan-name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g. Standard Rep 2024"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="add-plan-desc">Description (optional)</Label>
              <Input
                id="add-plan-desc"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Brief description"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={saving || !formName.trim()}>
              {saving ? "Saving..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editPlan} onOpenChange={(open) => !open && setEditPlan(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit pay plan</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-plan-name">Name</Label>
              <Input
                id="edit-plan-name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g. Standard Rep 2024"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-plan-desc">Description (optional)</Label>
              <Input
                id="edit-plan-desc"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Brief description"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditPlan(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={saving || !formName.trim()}>
              {saving ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletePlan} onOpenChange={(open) => !open && setDeletePlan(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate pay plan?</AlertDialogTitle>
            <AlertDialogDescription>
              &quot;{deletePlan?.name}&quot; will be marked inactive. It cannot be deleted if
              currently assigned to people. You can reactivate it later by editing.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={saving} className="bg-red-600">
              {saving ? "Deactivating..." : "Deactivate"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
