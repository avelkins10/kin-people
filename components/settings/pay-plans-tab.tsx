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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, MoreVertical, Edit, Eye, Trash2, Power } from "lucide-react";
import { PayPlanModal } from "./modals/pay-plan-modal";
import { useRouter } from "next/navigation";

interface PayPlan {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean | null;
  createdAt: Date | string | null;
  updatedAt: Date | string | null;
  rulesCount: number;
  peopleCount: number;
}

interface PayPlansTabProps {
  initialData: PayPlan[];
}

export function PayPlansTab({ initialData }: PayPlansTabProps) {
  const router = useRouter();
  const [payPlans, setPayPlans] = useState<PayPlan[]>(initialData);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPayPlan, setEditingPayPlan] = useState<PayPlan | null>(null);
  const [loading, setLoading] = useState(false);

  async function fetchPayPlans() {
    setLoading(true);
    try {
      const response = await fetch("/api/pay-plans");
      if (response.ok) {
        const data = await response.json();
        setPayPlans(data);
      }
    } catch (error) {
      console.error("Error fetching pay plans:", error);
    } finally {
      setLoading(false);
    }
  }

  function handleCreate() {
    setEditingPayPlan(null);
    setModalOpen(true);
  }

  function handleEdit(payPlan: PayPlan) {
    setEditingPayPlan(payPlan);
    setModalOpen(true);
  }

  function handleModalClose() {
    setModalOpen(false);
    setEditingPayPlan(null);
    fetchPayPlans();
    router.refresh();
  }

  async function handleToggleActive(payPlan: PayPlan) {
    try {
      const response = await fetch(`/api/pay-plans/${payPlan.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !payPlan.isActive }),
      });

      if (response.ok) {
        fetchPayPlans();
        router.refresh();
      } else {
        const error = await response.json();
        alert(error.error || "Failed to update pay plan");
      }
    } catch (error) {
      console.error("Error toggling pay plan status:", error);
      alert("Failed to update pay plan");
    }
  }

  async function handleDelete(payPlan: PayPlan) {
    if (
      !confirm(
        `Are you sure you want to delete "${payPlan.name}"? This will deactivate the pay plan.`
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/pay-plans/${payPlan.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchPayPlans();
        router.refresh();
      } else {
        const error = await response.json();
        alert(error.error || "Failed to delete pay plan");
      }
    } catch (error) {
      console.error("Error deleting pay plan:", error);
      alert("Failed to delete pay plan");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Pay Plans</h3>
          <p className="text-sm text-gray-600">
            Manage pay plans and their commission rules
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Create Pay Plan
        </Button>
      </div>

      <div className="rounded-lg bg-white shadow">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead># of Rules</TableHead>
              <TableHead># of People</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-gray-500">
                  Loading...
                </TableCell>
              </TableRow>
            ) : payPlans.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-gray-500">
                  No pay plans found. Create one to get started.
                </TableCell>
              </TableRow>
            ) : (
              payPlans.map((payPlan) => (
                <TableRow key={payPlan.id}>
                  <TableCell className="font-medium">{payPlan.name}</TableCell>
                  <TableCell className="text-gray-600">
                    {payPlan.description || "-"}
                  </TableCell>
                  <TableCell>{payPlan.rulesCount || 0}</TableCell>
                  <TableCell>{payPlan.peopleCount || 0}</TableCell>
                  <TableCell>
                    <Badge
                      variant={payPlan.isActive ? "default" : "outline"}
                    >
                      {payPlan.isActive ? "Active" : "Inactive"}
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
                        <DropdownMenuItem onClick={() => handleEdit(payPlan)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleToggleActive(payPlan)}
                        >
                          <Power className="h-4 w-4 mr-2" />
                          {payPlan.isActive ? "Deactivate" : "Activate"}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(payPlan)}
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

      <PayPlanModal
        open={modalOpen}
        onClose={handleModalClose}
        payPlan={editingPayPlan}
      />
    </div>
  );
}
