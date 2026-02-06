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
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { useUpdateRepcardAccount } from "@/hooks/use-repcard-data";

interface EditRepcardAccountModalProps {
  personId: string;
  account: {
    id: string;
    jobTitle?: string | null;
    repcardRole?: string | null;
    repcardOffice?: string | null;
    repcardTeam?: string | null;
  } | null;
  open: boolean;
  onClose: () => void;
}

export function EditRepcardAccountModal({
  personId,
  account,
  open,
  onClose,
}: EditRepcardAccountModalProps) {
  const updateMutation = useUpdateRepcardAccount();
  const [formData, setFormData] = useState({
    jobTitle: account?.jobTitle ?? "",
    repcardRole: account?.repcardRole ?? "",
    repcardOffice: account?.repcardOffice ?? "",
    repcardTeam: account?.repcardTeam ?? "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    updateMutation.mutate(
      {
        personId,
        data: {
          jobTitle: formData.jobTitle || undefined,
          repcardRole: formData.repcardRole || undefined,
          repcardOffice: formData.repcardOffice || undefined,
          repcardTeam: formData.repcardTeam || undefined,
        },
      },
      {
        onSuccess: () => {
          onClose();
        },
      }
    );
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit RepCard Account</DialogTitle>
          <DialogDescription>
            Update RepCard account fields. Changes will be synced to RepCard.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="edit-jobTitle">Job Title</Label>
              <Input
                id="edit-jobTitle"
                value={formData.jobTitle}
                onChange={(e) =>
                  setFormData({ ...formData, jobTitle: e.target.value })
                }
                placeholder="e.g. Sales Representative"
              />
            </div>
            <div>
              <Label htmlFor="edit-repcardRole">RepCard Role</Label>
              <Input
                id="edit-repcardRole"
                value={formData.repcardRole}
                onChange={(e) =>
                  setFormData({ ...formData, repcardRole: e.target.value })
                }
                placeholder="e.g. Sales Rep"
              />
            </div>
            <div>
              <Label htmlFor="edit-repcardOffice">RepCard Office</Label>
              <Input
                id="edit-repcardOffice"
                value={formData.repcardOffice}
                onChange={(e) =>
                  setFormData({ ...formData, repcardOffice: e.target.value })
                }
                placeholder="e.g. Phoenix"
              />
            </div>
            <div>
              <Label htmlFor="edit-repcardTeam">RepCard Team</Label>
              <Input
                id="edit-repcardTeam"
                value={formData.repcardTeam}
                onChange={(e) =>
                  setFormData({ ...formData, repcardTeam: e.target.value })
                }
                placeholder="e.g. Team Alpha"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
