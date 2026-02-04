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
import { useRouter } from "next/navigation";
import { toast } from "@/hooks/use-toast";
import type { RecruitWithDetails } from "@/types/recruiting";

interface ConvertToPersonModalProps {
  recruitId: string;
  open: boolean;
  onClose: () => void;
}

export function ConvertToPersonModal({
  recruitId,
  open,
  onClose,
}: ConvertToPersonModalProps) {
  const [recruit, setRecruit] = useState<RecruitWithDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [hireDate, setHireDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const router = useRouter();

  useEffect(() => {
    if (open && recruitId) {
      fetchRecruit();
    }
  }, [open, recruitId]);

  async function fetchRecruit() {
    try {
      const response = await fetch(`/api/recruits/${recruitId}`);
      if (response.ok) {
        const data = await response.json();
        setRecruit(data);
      }
    } catch (error) {
      console.error("Error fetching recruit:", error);
    }
  }

  async function handleConfirm() {
    if (!hireDate) {
      toast({
        title: "Error",
        description: "Please select a hire date",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `/api/recruits/${recruitId}/convert-to-person`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ hireDate }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to convert recruit",
          variant: "destructive",
        });
        return;
      }

      const result = await response.json();
      window.dispatchEvent(new CustomEvent("recruits-updated"));
      toast({
        title: "Success",
        description: "Recruit converted successfully!",
      });
      router.push(`/people/${result.personId}`);
    } catch (error) {
      console.error("Error converting recruit:", error);
      toast({
        title: "Error",
        description: "Failed to convert recruit",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  if (!recruit) {
    return null;
  }

  const { recruit: r, targetOffice, targetRole, targetPayPlan } = recruit;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Convert to Person</DialogTitle>
          <DialogDescription>
            Convert this recruit to an active person in the system.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
            <div>
              <span className="font-medium">Recruit:</span> {r.firstName}{" "}
              {r.lastName}
            </div>
            <div>
              <span className="font-medium">Target Office:</span>{" "}
              {targetOffice?.name || "N/A"}
            </div>
            <div>
              <span className="font-medium">Target Role:</span>{" "}
              {targetRole?.name || "N/A"}
            </div>
            <div>
              <span className="font-medium">Target Pay Plan:</span>{" "}
              {targetPayPlan?.name || "N/A"}
            </div>
          </div>

          <div>
            <Label htmlFor="hireDate">Hire Date *</Label>
            <Input
              id="hireDate"
              type="date"
              value={hireDate}
              onChange={(e) => setHireDate(e.target.value)}
              required
            />
          </div>

          <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-900">
            <p>
              This will create a new person record with the target assignments
              (office, role, pay plan, team), set their status to "active", and
              mark this recruit as "converted". The recruit's information will
              be preserved in the recruit history.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" onClick={handleConfirm} disabled={loading}>
            {loading ? "Converting..." : "Convert to Person"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
