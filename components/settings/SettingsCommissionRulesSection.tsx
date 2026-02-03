"use client";

import React, { useState } from "react";
import { FileText, Plus, Edit2, Trash2 } from "lucide-react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import type { CommissionRule, PayPlan } from "@/hooks/use-settings-data";

const RULE_TYPES = [
  "setter_commission",
  "closer_commission",
  "self_gen_commission",
  "override",
  "recruiting_bonus",
  "draw",
] as const;

const CALC_METHODS = [
  "flat_per_kw",
  "percentage_of_deal",
  "flat_fee",
] as const;

interface SettingsCommissionRulesSectionProps {
  commissionRules: CommissionRule[];
  payPlans: PayPlan[];
  loading: boolean;
  onRefetch: () => void;
}

export function SettingsCommissionRulesSection({
  commissionRules,
  payPlans,
  loading,
  onRefetch,
}: SettingsCommissionRulesSectionProps) {
  const [addOpen, setAddOpen] = useState(false);
  const [editRule, setEditRule] = useState<CommissionRule | null>(null);
  const [deleteRule, setDeleteRule] = useState<CommissionRule | null>(null);
  const [saving, setSaving] = useState(false);
  const [formPayPlanId, setFormPayPlanId] = useState("");
  const [formName, setFormName] = useState("");
  const [formRuleType, setFormRuleType] = useState<string>(RULE_TYPES[0]);
  const [formCalcMethod, setFormCalcMethod] = useState<string>(CALC_METHODS[0]);
  const [formAmount, setFormAmount] = useState("");

  const resetForm = () => {
    setFormPayPlanId(payPlans[0]?.id ?? "");
    setFormName("");
    setFormRuleType(RULE_TYPES[0]);
    setFormCalcMethod(CALC_METHODS[0]);
    setFormAmount("");
    setEditRule(null);
  };

  const openAdd = () => {
    setFormPayPlanId(payPlans[0]?.id ?? "");
    setFormName("");
    setFormRuleType(RULE_TYPES[0]);
    setFormCalcMethod(CALC_METHODS[0]);
    setFormAmount("");
    setAddOpen(true);
  };

  const openEdit = (rule: CommissionRule) => {
    setEditRule(rule);
    setFormPayPlanId(rule.payPlanId);
    setFormName(rule.name ?? "");
    setFormRuleType(rule.ruleType);
    setFormCalcMethod(rule.calcMethod);
    setFormAmount(rule.amount ?? "");
  };

  const handleCreate = async () => {
    if (!formPayPlanId || !formAmount.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/commission-rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payPlanId: formPayPlanId,
          name: formName.trim() || undefined,
          ruleType: formRuleType,
          calcMethod: formCalcMethod,
          amount: formAmount.trim(),
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
      alert(e instanceof Error ? e.message : "Failed to create rule");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!editRule || !formAmount.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/commission-rules/${editRule.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName.trim() || null,
          ruleType: formRuleType,
          calcMethod: formCalcMethod,
          amount: formAmount.trim(),
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error || "Failed to update");
      }
      setEditRule(null);
      resetForm();
      onRefetch();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to update rule");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteRule) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/commission-rules/${deleteRule.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error || "Failed to delete");
      }
      setDeleteRule(null);
      onRefetch();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to delete rule");
    } finally {
      setSaving(false);
    }
  };

  const formatLabel = (s: string) =>
    s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div className="bg-white border border-gray-100 rounded-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-indigo-600" />
          <h3 className="text-lg font-extrabold uppercase tracking-tight text-black">
            Commission Rules
          </h3>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={openAdd}
          disabled={payPlans.length === 0}
          aria-label="Add commission rule"
        >
          <Plus className="w-4 h-4 text-gray-500" />
        </Button>
      </div>
      <div className="space-y-3">
        {loading ? (
          <p className="text-sm text-gray-500">Loading...</p>
        ) : commissionRules.length === 0 ? (
          <p className="text-sm text-gray-500">
            No commission rules yet. Add a pay plan first, then add rules.
          </p>
        ) : (
          commissionRules.map((rule) => (
            <div
              key={rule.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-sm group"
            >
              <div>
                <span className="font-bold text-sm text-gray-700 block">
                  {rule.name || formatLabel(rule.ruleType)}
                </span>
                <span className="text-[10px] font-bold uppercase text-gray-400">
                  {rule.payPlanName ?? "—"} · {formatLabel(rule.calcMethod)} · {rule.amount}
                </span>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => openEdit(rule)}
                  aria-label={`Edit rule ${rule.name || rule.ruleType}`}
                >
                  <Edit2 className="w-3 h-3 text-indigo-600" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setDeleteRule(rule)}
                  aria-label={`Delete rule`}
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
            <DialogTitle>Add commission rule</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Pay plan</Label>
              <Select value={formPayPlanId} onValueChange={setFormPayPlanId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select pay plan" />
                </SelectTrigger>
                <SelectContent>
                  {payPlans.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="add-rule-name">Name (optional)</Label>
              <Input
                id="add-rule-name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g. Setter per kW"
              />
            </div>
            <div className="grid gap-2">
              <Label>Rule type</Label>
              <Select value={formRuleType} onValueChange={setFormRuleType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RULE_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {formatLabel(t)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Calc method</Label>
              <Select value={formCalcMethod} onValueChange={setFormCalcMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CALC_METHODS.map((m) => (
                    <SelectItem key={m} value={m}>
                      {formatLabel(m)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="add-rule-amount">Amount</Label>
              <Input
                id="add-rule-amount"
                value={formAmount}
                onChange={(e) => setFormAmount(e.target.value)}
                placeholder="e.g. 0.25 or 50"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={saving || !formPayPlanId || !formAmount.trim()}
            >
              {saving ? "Saving..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editRule} onOpenChange={(open) => !open && setEditRule(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit commission rule</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-rule-name">Name (optional)</Label>
              <Input
                id="edit-rule-name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g. Setter per kW"
              />
            </div>
            <div className="grid gap-2">
              <Label>Rule type</Label>
              <Select value={formRuleType} onValueChange={setFormRuleType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RULE_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {formatLabel(t)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Calc method</Label>
              <Select value={formCalcMethod} onValueChange={setFormCalcMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CALC_METHODS.map((m) => (
                    <SelectItem key={m} value={m}>
                      {formatLabel(m)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-rule-amount">Amount</Label>
              <Input
                id="edit-rule-amount"
                value={formAmount}
                onChange={(e) => setFormAmount(e.target.value)}
                placeholder="e.g. 0.25 or 50"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditRule(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={saving || !formAmount.trim()}>
              {saving ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteRule} onOpenChange={(open) => !open && setDeleteRule(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate commission rule?</AlertDialogTitle>
            <AlertDialogDescription>
              This rule will be marked inactive. You can reactivate it later by editing.
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
