"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, MoreVertical, Edit, Copy, Trash2, Power } from "lucide-react";
import { CommissionRuleModal } from "./modals/commission-rule-modal";
import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";
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
  payPlanName?: string;
  appliesToRoleName?: string | null;
}

interface PayPlan {
  id: string;
  name: string;
}

interface CommissionRulesTabProps {
  initialData: CommissionRule[];
}

export function CommissionRulesTab({
  initialData,
}: CommissionRulesTabProps) {
  const router = useRouter();
  const [rules, setRules] = useState<CommissionRule[]>(initialData);
  const [payPlans, setPayPlans] = useState<PayPlan[]>([]);
  const [selectedPayPlanId, setSelectedPayPlanId] = useState<string>("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<CommissionRule | null>(null);
  const [duplicateFrom, setDuplicateFrom] = useState<CommissionRule | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchPayPlans();
  }, []);

  async function fetchPayPlans() {
    try {
      const response = await fetch("/api/pay-plans?active=true");
      if (response.ok) {
        const data = await response.json();
        setPayPlans(data);
      }
    } catch (error) {
      console.error("Error fetching pay plans:", error);
    }
  }

  async function fetchRules() {
    if (!selectedPayPlanId) {
      setRules([]);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `/api/commission-rules?payPlanId=${selectedPayPlanId}`
      );
      if (response.ok) {
        const data = await response.json();
        setRules(data);
      }
    } catch (error) {
      console.error("Error fetching commission rules:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchRules();
  }, [selectedPayPlanId]);

  function handleCreate() {
    setEditingRule(null);
    setModalOpen(true);
  }

  function handleEdit(rule: CommissionRule) {
    setEditingRule(rule);
    setModalOpen(true);
  }

  function handleDuplicate(rule: CommissionRule) {
    setEditingRule(null);
    setDuplicateFrom(rule);
    setModalOpen(true);
  }

  function handleModalClose() {
    setModalOpen(false);
    setEditingRule(null);
    setDuplicateFrom(null);
    fetchRules();
    router.refresh();
  }

  async function handleToggleActive(rule: CommissionRule) {
    try {
      const response = await fetch(`/api/commission-rules/${rule.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !rule.isActive }),
      });

      if (response.ok) {
        fetchRules();
        router.refresh();
      } else {
        const error = await response.json();
        toast({
          variant: "destructive",
          title: "Error",
          description: error.error || "Failed to update commission rule",
        });
      }
    } catch (error) {
      console.error("Error toggling commission rule status:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update commission rule",
      });
    }
  }

  async function handleDelete(rule: CommissionRule) {
    if (
      !confirm(
        `Are you sure you want to delete this commission rule? This will deactivate the rule.`
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/commission-rules/${rule.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchRules();
        router.refresh();
      } else {
        const error = await response.json();
        toast({
          variant: "destructive",
          title: "Error",
          description: error.error || "Failed to delete commission rule",
        });
      }
    } catch (error) {
      console.error("Error deleting commission rule:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete commission rule",
      });
    }
  }

  function formatRuleType(ruleType: string): string {
    return ruleType
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  function formatCalcMethod(calcMethod: string): string {
    const methods: Record<string, string> = {
      flat_per_kw: "Per kW",
      percentage_of_deal: "Percentage",
      flat_fee: "Flat Fee",
    };
    return methods[calcMethod] || calcMethod;
  }

  function getConditionsDisplay(conditions: any): string {
    if (!conditions || typeof conditions !== "object") return "-";
    const parts: string[] = [];
    if (conditions.setter_tier) {
      parts.push(`Tier: ${conditions.setter_tier}`);
    }
    if (conditions.min_kw) {
      parts.push(`Min: ${conditions.min_kw}kW`);
    }
    if (conditions.ppw_floor) {
      parts.push(`PPW: $${conditions.ppw_floor}`);
    }
    if (conditions.deal_types && Array.isArray(conditions.deal_types)) {
      parts.push(`Types: ${conditions.deal_types.join(", ")}`);
    }
    return parts.length > 0 ? parts.join(", ") : "-";
  }

  const filteredRules = selectedPayPlanId
    ? rules.filter((r) => r.payPlanId === selectedPayPlanId)
    : [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Commission Rules</h3>
          <p className="text-sm text-gray-600">
            Manage commission calculation rules for pay plans
          </p>
        </div>
        <Button onClick={handleCreate} disabled={!selectedPayPlanId}>
          <Plus className="h-4 w-4 mr-2" />
          Create Rule
        </Button>
      </div>

      <div className="rounded-lg bg-white p-4 shadow">
        <div className="flex items-center gap-4">
          <Label htmlFor="payPlanFilter">Pay Plan *</Label>
          <Select value={selectedPayPlanId} onValueChange={setSelectedPayPlanId}>
            <SelectTrigger className="w-[300px]">
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
      </div>

      {selectedPayPlanId && (
        <div className="rounded-lg bg-white shadow">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rule Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Calc Method</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Applies To Role</TableHead>
                <TableHead>Conditions</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center text-gray-500"
                  >
                    Loading...
                  </TableCell>
                </TableRow>
              ) : filteredRules.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center text-gray-500"
                  >
                    No commission rules found. Create one to get started.
                  </TableCell>
                </TableRow>
              ) : (
                filteredRules.map((rule) => (
                  <TableRow key={rule.id}>
                    <TableCell className="font-medium">
                      {rule.name || "-"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {formatRuleType(rule.ruleType)}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatCalcMethod(rule.calcMethod)}</TableCell>
                    <TableCell>
                      {rule.calcMethod === "percentage_of_deal"
                        ? `${rule.amount}%`
                        : `$${rule.amount}`}
                    </TableCell>
                    <TableCell>
                      {rule.appliesToRoleName || "-"}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {getConditionsDisplay(rule.conditions)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={rule.isActive ? "default" : "outline"}
                      >
                        {rule.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(rule)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDuplicate(rule)}
                          >
                            <Copy className="h-4 w-4 mr-2" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleToggleActive(rule)}
                          >
                            <Power className="h-4 w-4 mr-2" />
                            {rule.isActive ? "Deactivate" : "Activate"}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(rule)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {!selectedPayPlanId && (
        <div className="rounded-lg bg-white p-8 shadow text-center text-gray-500">
          Please select a pay plan to view and manage commission rules.
        </div>
      )}

      <CommissionRuleModal
        open={modalOpen}
        onClose={handleModalClose}
        rule={editingRule}
        duplicateFrom={duplicateFrom}
        payPlanId={selectedPayPlanId}
      />
    </div>
  );
}
