"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { UserMinus } from "lucide-react";
import { useRemovePerson } from "@/hooks/use-people-data";

interface RemovePersonModalProps {
  personId: string;
  personName: string;
  open: boolean;
  onClose: () => void;
}

export function RemovePersonModal({
  personId,
  personName,
  open,
  onClose,
}: RemovePersonModalProps) {
  const router = useRouter();
  const removeMutation = useRemovePerson();
  const [confirmed, setConfirmed] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!confirmed) return;

    try {
      await removeMutation.mutateAsync(personId);
      onClose();
      router.push("/people");
      router.refresh();
    } catch {
      // Error already shown by mutation
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <UserMinus className="h-5 w-5" />
            Remove Person
          </DialogTitle>
          <DialogDescription>
            Permanently remove this person from the system. Use this for duplicates or mistaken entries. If they have deals, commissions, or recruiting history, use Terminate instead.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="rounded-lg bg-red-50 p-4 text-sm text-red-800">
              <p className="font-medium">Permanently remove {personName}?</p>
              <p>This cannot be undone. All profile data, onboarding progress, and assignments for this person will be removed.</p>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="confirmed"
                checked={confirmed}
                onCheckedChange={(checked) => setConfirmed(checked === true)}
              />
              <Label htmlFor="confirmed" className="cursor-pointer">
                I understand this is permanent
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={removeMutation.isPending || !confirmed}
              variant="destructive"
            >
              {removeMutation.isPending ? "Removing..." : "Remove person"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
