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
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface CommissionRule {
  id: string;
  payPlanId: string;
  name: string | null;
  ruleType: string;
  calcMethod: string;
  amount: string;
  appliesToRoleId: string | null;
  overrideLevel: number | null;
  overrideSource: string | null;
  dealTypes: string[] | null;
  conditions: any;
  isActive: boolean | null;
  sortOrder: number | null;
}

interface CommissionRuleModalProps {
  open: boolean;
  onClose: () => void;
  rule?: CommissionRule | null;
  duplicateFrom?: CommissionRule | null;
  payPlanId: string;
}

const RULE_TYPES = [
  { value: "setter_commission", label: "Setter Commission" },
  { value: "closer_commission", label: "Closer Commission" },
  { value: "self_gen_commission", label: "Self Gen Commission" },
  { value: "override", label: "Override" },
  { value: "recruiting_bonus", label: "Recruiting Bonus" },
  { value: "draw", label: "Draw" },
];

const CALC_METHODS = [
  { value: "flat_per_kw", label: "Per kW" },
  { value: "percentage_of_deal", label: "Percentage of Deal" },
  { value: "flat_fee", label: "Flat Fee" },
];

const OVERRIDE_SOURCES = [
  { value: "reports_to", label: "Reports To" },
  { value: "recruited_by", label: "Recruited By" },
];

const SETTER_TIERS = ["Rookie", "Veteran", "Team Lead"];

const DEAL_TYPES = ["Solar", "HVAC", "Roofing"];

export function CommissionRuleModal({
  open,
  onClose,
  rule,
  duplicateFrom,
  payPlanId,
}: CommissionRuleModalProps) {
  const [loading, setLoading] = useState(false);
  const [payPlans, setPayPlans] = useState<Array<{ id: string; name: string }>>(
    []
  );
  const [roles, setRoles] = useState<Array<{ id: string; name: string }>>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [formData, setFormData] = useState({
    payPlanId: payPlanId || "",
    name: "",
    ruleType: "setter_commission",
    calcMethod: "flat_per_kw",
    amount: "",
    appliesToRoleId: "",
    overrideLevel: "",
    overrideSource: "",
    dealTypes: [] as string[],
    setterTier: [] as string[],
    minKw: "",
    ppwFloor: "",
    isActive: true,
    sortOrder: "0",
  });

  useEffect(() => {
    if (open) {
      fetchOptions();
      if (rule) {
        const conditions = rule.conditions || {};
        setFormData({
          payPlanId: rule.payPlanId,
          name: rule.name || "",
          ruleType: rule.ruleType,
          calcMethod: rule.calcMethod,
          amount: rule.amount,
          appliesToRoleId: rule.appliesToRoleId || "",
          overrideLevel: rule.overrideLevel?.toString() || "",
          overrideSource: rule.overrideSource || "",
          dealTypes: rule.dealTypes || [],
          setterTier: conditions.setter_tier
            ? Array.isArray(conditions.setter_tier)
              ? conditions.setter_tier
              : [conditions.setter_tier]
            : [],
          minKw: conditions.min_kw?.toString() || "",
          ppwFloor: conditions.ppw_floor?.toString() || "",
          isActive: rule.isActive ?? true,
          sortOrder: rule.sortOrder?.toString() || "0",
        });
      } else if (duplicateFrom) {
        const conditions = duplicateFrom.conditions || {};
        setFormData({
          payPlanId: duplicateFrom.payPlanId,
          name: duplicateFrom.name ? `${duplicateFrom.name} (Copy)` : "",
          ruleType: duplicateFrom.ruleType,
          calcMethod: duplicateFrom.calcMethod,
          amount: duplicateFrom.amount,
          appliesToRoleId: duplicateFrom.appliesToRoleId || "",
          overrideLevel: duplicateFrom.overrideLevel?.toString() || "",
          overrideSource: duplicateFrom.overrideSource || "",
          dealTypes: duplicateFrom.dealTypes || [],
          setterTier: conditions.setter_tier
            ? Array.isArray(conditions.setter_tier)
              ? conditions.setter_tier
              : [conditions.setter_tier]
            : [],
          minKw: conditions.min_kw?.toString() || "",
          ppwFloor: conditions.ppw_floor?.toString() || "",
          isActive: duplicateFrom.isActive ?? true,
          sortOrder: duplicateFrom.sortOrder?.toString() || "0",
        });
      } else {
        setFormData({
          payPlanId: payPlanId || "",
          name: "",
          ruleType: "setter_commission",
          calcMethod: "flat_per_kw",
          amount: "",
          appliesToRoleId: "",
          overrideLevel: "",
          overrideSource: "",
          dealTypes: [],
          setterTier: [],
          minKw: "",
          ppwFloor: "",
          isActive: true,
          sortOrder: "0",
        });
      }
    }
  }, [rule, duplicateFrom, open, payPlanId]);

  async function fetchOptions() {
    try {
      const [payPlansRes, rolesRes] = await Promise.all([
        fetch("/api/pay-plans?active=true"),
        fetch("/api/roles?active=true"),
      ]);

      if (payPlansRes.ok) {
        const data = await payPlansRes.json();
        setPayPlans(data);
      }

      if (rolesRes.ok) {
        const data = await rolesRes.json();
        setRoles(data);
      }
    } catch (error) {
      console.error("Error fetching options:", error);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      // Build conditions object
      const conditions: any = {};
      if (formData.setterTier.length > 0) {
        conditions.setter_tier =
          formData.setterTier.length === 1
            ? formData.setterTier[0]
            : formData.setterTier;
      }
      if (formData.minKw) {
        conditions.min_kw = parseFloat(formData.minKw);
      }
      if (formData.ppwFloor) {
        conditions.ppw_floor = parseFloat(formData.ppwFloor);
      }
      if (formData.dealTypes.length > 0) {
        conditions.deal_types = formData.dealTypes;
      }

      const payload: any = {
        payPlanId: formData.payPlanId,
        name: formData.name || undefined,
        ruleType: formData.ruleType,
        calcMethod: formData.calcMethod,
        amount: formData.amount,
        isActive: formData.isActive,
        sortOrder: parseInt(formData.sortOrder) || 0,
      };

      if (formData.appliesToRoleId) {
        payload.appliesToRoleId = formData.appliesToRoleId;
      }

      if (formData.ruleType === "override") {
        if (!formData.overrideLevel || !formData.overrideSource) {
          toast({
            variant: "destructive",
            title: "Error",
            description: "Override rules must have both Override Level and Override Source",
          });
          setLoading(false);
          return;
        }
        payload.overrideLevel = parseInt(formData.overrideLevel);
        payload.overrideSource = formData.overrideSource;
      }

      if (Object.keys(conditions).length > 0) {
        payload.conditions = conditions;
      }

      // Use POST for duplicates (when duplicateFrom is set but rule is null)
      // Use PUT only when editing an existing rule (rule is set)
      const isDuplicating = !rule && duplicateFrom;
      const url = rule
        ? `/api/commission-rules/${rule.id}`
        : "/api/commission-rules";
      const method = rule ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        toast({
          variant: "destructive",
          title: "Error",
          description: error.error || "Failed to save commission rule",
        });
        return;
      }

      onClose();
    } catch (error) {
      console.error("Error saving commission rule:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save commission rule",
      });
    } finally {
      setLoading(false);
    }
  }

  function toggleDealType(type: string) {
    setFormData((prev) => ({
      ...prev,
      dealTypes: prev.dealTypes.includes(type)
        ? prev.dealTypes.filter((t) => t !== type)
        : [...prev.dealTypes, type],
    }));
  }

  function toggleSetterTier(tier: string) {
    setFormData((prev) => ({
      ...prev,
      setterTier: prev.setterTier.includes(tier)
        ? prev.setterTier.filter((t) => t !== tier)
        : [...prev.setterTier, tier],
    }));
  }

  const isOverride = formData.ruleType === "override";

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {rule ? "Edit Commission Rule" : duplicateFrom ? "Duplicate Commission Rule" : "Create Commission Rule"}
          </DialogTitle>
          <DialogDescription>
            {rule
              ? "Update the commission rule details."
              : duplicateFrom
              ? "Create a copy of this commission rule."
              : "Create a new commission rule for the selected pay plan."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="payPlanId">Pay Plan *</Label>
              <Select
                value={formData.payPlanId}
                onValueChange={(value) =>
                  setFormData({ ...formData, payPlanId: value })
                }
                disabled={!!payPlanId}
                required
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
              <Label htmlFor="name">Rule Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Optional descriptive name"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="ruleType">Rule Type *</Label>
                <Select
                  value={formData.ruleType}
                  onValueChange={(value) =>
                    setFormData({ ...formData, ruleType: value })
                  }
                  required
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RULE_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="calcMethod">Calculation Method *</Label>
                <Select
                  value={formData.calcMethod}
                  onValueChange={(value) =>
                    setFormData({ ...formData, calcMethod: value })
                  }
                  required
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CALC_METHODS.map((method) => (
                      <SelectItem key={method.value} value={method.value}>
                        {method.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="amount">
                Amount *{" "}
                {formData.calcMethod === "percentage_of_deal" && "(%)"}
                {formData.calcMethod === "flat_per_kw" && "($ per kW)"}
                {formData.calcMethod === "flat_fee" && "($)"}
              </Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) =>
                  setFormData({ ...formData, amount: e.target.value })
                }
                placeholder="0.00"
                required
              />
            </div>

            {isOverride ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="overrideLevel">Override Level *</Label>
                    <Input
                      id="overrideLevel"
                      type="number"
                      min="1"
                      value={formData.overrideLevel}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          overrideLevel: e.target.value,
                        })
                      }
                      placeholder="1, 2, 3..."
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="overrideSource">Override Source *</Label>
                    <Select
                      value={formData.overrideSource}
                      onValueChange={(value) =>
                        setFormData({ ...formData, overrideSource: value })
                      }
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select source" />
                      </SelectTrigger>
                      <SelectContent>
                        {OVERRIDE_SOURCES.map((source) => (
                          <SelectItem key={source.value} value={source.value}>
                            {source.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="appliesToRoleId">Applies To Role</Label>
                  <Select
                    value={formData.appliesToRoleId}
                    onValueChange={(value) =>
                      setFormData({ ...formData, appliesToRoleId: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All roles" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All roles</SelectItem>
                      {roles.map((role) => (
                        <SelectItem key={role.id} value={role.id}>
                          {role.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            ) : (
              <div>
                <Label htmlFor="appliesToRoleId">Applies To Role</Label>
                <Select
                  value={formData.appliesToRoleId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, appliesToRoleId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All roles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All roles</SelectItem>
                    {roles.map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="border-t pt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="w-full justify-between"
              >
                <span>Advanced Conditions</span>
                {showAdvanced ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>

              {showAdvanced && (
                <div className="mt-4 space-y-4">
                  <div>
                    <Label>Setter Tier</Label>
                    <div className="flex gap-4 mt-2">
                      {SETTER_TIERS.map((tier) => (
                        <div key={tier} className="flex items-center space-x-2">
                          <Checkbox
                            id={`tier-${tier}`}
                            checked={formData.setterTier.includes(tier)}
                            onCheckedChange={() => toggleSetterTier(tier)}
                          />
                          <Label
                            htmlFor={`tier-${tier}`}
                            className="text-sm font-normal cursor-pointer"
                          >
                            {tier}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label>Deal Types</Label>
                    <div className="flex gap-4 mt-2">
                      {DEAL_TYPES.map((type) => (
                        <div key={type} className="flex items-center space-x-2">
                          <Checkbox
                            id={`deal-${type}`}
                            checked={formData.dealTypes.includes(
                              type.toLowerCase()
                            )}
                            onCheckedChange={() =>
                              toggleDealType(type.toLowerCase())
                            }
                          />
                          <Label
                            htmlFor={`deal-${type}`}
                            className="text-sm font-normal cursor-pointer"
                          >
                            {type}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="minKw">Minimum kW</Label>
                      <Input
                        id="minKw"
                        type="number"
                        step="0.1"
                        value={formData.minKw}
                        onChange={(e) =>
                          setFormData({ ...formData, minKw: e.target.value })
                        }
                        placeholder="0.0"
                      />
                    </div>
                    <div>
                      <Label htmlFor="ppwFloor">PPW Floor ($)</Label>
                      <Input
                        id="ppwFloor"
                        type="number"
                        step="0.01"
                        value={formData.ppwFloor}
                        onChange={(e) =>
                          setFormData({ ...formData, ppwFloor: e.target.value })
                        }
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="sortOrder">Sort Order</Label>
                <Input
                  id="sortOrder"
                  type="number"
                  value={formData.sortOrder}
                  onChange={(e) =>
                    setFormData({ ...formData, sortOrder: e.target.value })
                  }
                  placeholder="0"
                />
              </div>
              <div className="flex items-center space-x-2 pt-8">
                <Checkbox
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isActive: checked === true })
                  }
                />
                <Label
                  htmlFor="isActive"
                  className="text-sm font-normal cursor-pointer"
                >
                  Active
                </Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : rule ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
