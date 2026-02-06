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
import { Input } from "@/components/ui/input";
import { Loader2, Search, Link2 } from "lucide-react";
import { useSearchRepcardUsers, useLinkRepcardAccount } from "@/hooks/use-repcard-data";

interface LinkRepcardAccountModalProps {
  personId: string;
  open: boolean;
  onClose: () => void;
}

export function LinkRepcardAccountModal({
  personId,
  open,
  onClose,
}: LinkRepcardAccountModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const linkMutation = useLinkRepcardAccount();
  const { data: searchResults = [], isLoading: searching } = useSearchRepcardUsers(debouncedQuery);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  function handleLink(repcardUserId: string) {
    linkMutation.mutate(
      { personId, repcardUserId },
      {
        onSuccess: () => {
          onClose();
        },
      }
    );
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Link Existing RepCard Account</DialogTitle>
          <DialogDescription>
            Search for an existing RepCard user to link to this person.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              className="pl-9"
              placeholder="Search by name, email, or username..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="max-h-64 overflow-y-auto space-y-2">
            {searching && (
              <div className="flex items-center gap-2 py-4 justify-center text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Searching...
              </div>
            )}
            {!searching && debouncedQuery.length >= 2 && searchResults.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">
                No RepCard users found matching &ldquo;{debouncedQuery}&rdquo;
              </p>
            )}
            {!searching &&
              searchResults.map((user: { id: string | number; firstName?: string; lastName?: string; email?: string; username?: string; office?: string; team?: string }) => (
                <div
                  key={String(user.id)}
                  className="flex items-center justify-between rounded-md border p-3"
                >
                  <div className="text-sm">
                    <p className="font-medium">
                      {[user.firstName, user.lastName].filter(Boolean).join(" ") || "Unknown"}
                    </p>
                    <p className="text-gray-500">
                      {user.email ?? user.username ?? "—"} · ID: {String(user.id)}
                    </p>
                    {(user.office || user.team) && (
                      <p className="text-gray-400">
                        {[user.office, user.team].filter(Boolean).join(" / ")}
                      </p>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleLink(String(user.id))}
                    disabled={linkMutation.isPending}
                  >
                    {linkMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Link2 className="h-4 w-4 mr-1" />
                        Link
                      </>
                    )}
                  </Button>
                </div>
              ))}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
