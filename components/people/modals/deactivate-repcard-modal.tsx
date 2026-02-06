"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Loader2 } from "lucide-react";
import { useDeactivateRepcardAccount } from "@/hooks/use-repcard-data";

interface DeactivateRepcardModalProps {
  personId: string;
  open: boolean;
  onClose: () => void;
}

export function DeactivateRepcardModal({
  personId,
  open,
  onClose,
}: DeactivateRepcardModalProps) {
  const deactivateMutation = useDeactivateRepcardAccount();

  function handleDeactivate() {
    deactivateMutation.mutate(personId, {
      onSuccess: () => {
        onClose();
      },
    });
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Deactivate RepCard Account
          </DialogTitle>
          <DialogDescription>
            This will immediately deactivate the person&apos;s RepCard account.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <div className="rounded-lg bg-red-50 p-4 text-sm text-red-800">
            <p className="font-medium">Warning:</p>
            <p>
              The person will immediately lose access to RepCard. This action can
              be reversed by reactivating the account.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDeactivate}
            disabled={deactivateMutation.isPending}
          >
            {deactivateMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
                Deactivating...
              </>
            ) : (
              "Deactivate"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
