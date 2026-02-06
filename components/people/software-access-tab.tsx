"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, ExternalLink, Link2, Power, AlertCircle } from "lucide-react";
import {
  useRepcardAccount,
  useSyncRepcardAccount,
  useUnlinkRepcardAccount,
} from "@/hooks/use-repcard-data";
import { CreateRepcardAccountModal } from "./modals/create-repcard-account-modal";
import { EditRepcardAccountModal } from "./modals/edit-repcard-account-modal";
import { LinkRepcardAccountModal } from "./modals/link-repcard-account-modal";
import { DeactivateRepcardModal } from "./modals/deactivate-repcard-modal";

interface SoftwareAccessTabProps {
  personId: string;
}

function statusBadge(status: string) {
  switch (status) {
    case "active":
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Active</Badge>;
    case "deactivated":
      return <Badge variant="secondary">Deactivated</Badge>;
    case "error":
      return <Badge variant="destructive">Error</Badge>;
    case "pending":
      return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pending</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export function SoftwareAccessTab({ personId }: SoftwareAccessTabProps) {
  const { data, isLoading } = useRepcardAccount(personId);
  const syncMutation = useSyncRepcardAccount();
  const unlinkMutation = useUnlinkRepcardAccount();
  const [openModal, setOpenModal] = useState<string | null>(null);

  const account = data?.account ?? null;

  return (
    <div className="space-y-4">
      {/* RepCard Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="text-lg">RepCard</CardTitle>
            <CardDescription>Canvassing tool account management</CardDescription>
          </div>
          {account && statusBadge(account.status)}
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center gap-2 py-4 text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading...
            </div>
          ) : account ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">RepCard User ID</p>
                  <p className="font-medium">{account.repcardUserId ?? "—"}</p>
                </div>
                <div>
                  <p className="text-gray-500">Username</p>
                  <p className="font-medium">{account.repcardUsername ?? "—"}</p>
                </div>
                <div>
                  <p className="text-gray-500">Job Title</p>
                  <p className="font-medium">{account.jobTitle ?? "—"}</p>
                </div>
                <div>
                  <p className="text-gray-500">Role</p>
                  <p className="font-medium">{account.repcardRole ?? "—"}</p>
                </div>
                <div>
                  <p className="text-gray-500">Office / Team</p>
                  <p className="font-medium">
                    {[account.repcardOffice, account.repcardTeam].filter(Boolean).join(" / ") || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Last Synced</p>
                  <p className="font-medium">
                    {account.lastSyncedAt
                      ? new Date(account.lastSyncedAt).toLocaleString()
                      : "Never"}
                  </p>
                </div>
              </div>

              {account.lastSyncError && (
                <div className="flex items-start gap-2 rounded-md bg-red-50 p-3 text-sm text-red-800">
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  <p>{account.lastSyncError}</p>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setOpenModal("edit")}
                >
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => syncMutation.mutate(personId)}
                  disabled={syncMutation.isPending}
                >
                  {syncMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-1" />
                  )}
                  Sync Now
                </Button>
                {account.status === "active" ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                    onClick={() => setOpenModal("deactivate")}
                  >
                    <Power className="h-4 w-4 mr-1" />
                    Deactivate
                  </Button>
                ) : account.status === "deactivated" ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setOpenModal("edit")}
                  >
                    Reactivate
                  </Button>
                ) : null}
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-500 hover:text-red-600"
                  onClick={() => unlinkMutation.mutate(personId)}
                  disabled={unlinkMutation.isPending}
                >
                  {unlinkMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  ) : null}
                  Unlink
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3 py-2">
              <p className="text-sm text-gray-500">No RepCard account linked to this person.</p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => setOpenModal("create")}
                >
                  <ExternalLink className="h-4 w-4 mr-1" />
                  Create Account
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setOpenModal("link")}
                >
                  <Link2 className="h-4 w-4 mr-1" />
                  Link Existing Account
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Future placeholder cards */}
      <Card className="opacity-50">
        <CardHeader>
          <CardTitle className="text-lg text-gray-400">Enerflo</CardTitle>
          <CardDescription>Coming soon</CardDescription>
        </CardHeader>
      </Card>
      <Card className="opacity-50">
        <CardHeader>
          <CardTitle className="text-lg text-gray-400">GoHighLevel</CardTitle>
          <CardDescription>Coming soon</CardDescription>
        </CardHeader>
      </Card>

      {/* Modals */}
      {openModal === "create" && (
        <CreateRepcardAccountModal
          personId={personId}
          open={true}
          onClose={() => setOpenModal(null)}
        />
      )}
      {openModal === "edit" && (
        <EditRepcardAccountModal
          personId={personId}
          account={account}
          open={true}
          onClose={() => setOpenModal(null)}
        />
      )}
      {openModal === "link" && (
        <LinkRepcardAccountModal
          personId={personId}
          open={true}
          onClose={() => setOpenModal(null)}
        />
      )}
      {openModal === "deactivate" && (
        <DeactivateRepcardModal
          personId={personId}
          open={true}
          onClose={() => setOpenModal(null)}
        />
      )}
    </div>
  );
}
