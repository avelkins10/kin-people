"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical } from "lucide-react";
import { ChangeRoleModal } from "./modals/change-role-modal";
import { ChangeOfficeModal } from "./modals/change-office-modal";
import { ChangeManagerModal } from "./modals/change-manager-modal";
import { ChangePayPlanModal } from "./modals/change-pay-plan-modal";
import { AddToTeamModal } from "./modals/add-to-team-modal";
import { TerminateModal } from "./modals/terminate-modal";
import { RemovePersonModal } from "./modals/remove-person-modal";
import { CreateRepcardAccountModal } from "./modals/create-repcard-account-modal";
import { DeactivateRepcardModal } from "./modals/deactivate-repcard-modal";
import { useRepcardAccount, useSyncRepcardAccount } from "@/hooks/use-repcard-data";
import { useResendInvite } from "@/hooks/use-people-data";

interface PersonActionMenuProps {
  personId: string;
  personName?: string;
}

export function PersonActionMenu({ personId, personName = "this person" }: PersonActionMenuProps) {
  const [openModal, setOpenModal] = useState<string | null>(null);
  const { data: repcardData } = useRepcardAccount(personId);
  const syncMutation = useSyncRepcardAccount();
  const resendInvite = useResendInvite();
  const repcardAccount = repcardData?.account ?? null;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreVertical className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setOpenModal("role")}>
            Change Role
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setOpenModal("office")}>
            Change Office
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setOpenModal("manager")}>
            Change Manager
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setOpenModal("pay-plan")}>
            Change Pay Plan
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setOpenModal("team")}>
            Add to Team
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => resendInvite.mutate(personId)}>
            Resend Invite
          </DropdownMenuItem>
          {!repcardAccount && (
            <DropdownMenuItem onClick={() => setOpenModal("create-repcard")}>
              Create RepCard Account
            </DropdownMenuItem>
          )}
          {repcardAccount?.status === "active" && (
            <DropdownMenuItem onClick={() => syncMutation.mutate(personId)}>
              Sync RepCard Account
            </DropdownMenuItem>
          )}
          {repcardAccount?.status === "active" && (
            <DropdownMenuItem
              onClick={() => setOpenModal("deactivate-repcard")}
              className="text-red-600"
            >
              Deactivate RepCard Account
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            onClick={() => setOpenModal("terminate")}
            className="text-red-600"
          >
            Terminate
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setOpenModal("remove")}
            className="text-red-600"
          >
            Remove person
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {openModal === "role" && (
        <ChangeRoleModal
          personId={personId}
          open={true}
          onClose={() => setOpenModal(null)}
        />
      )}
      {openModal === "office" && (
        <ChangeOfficeModal
          personId={personId}
          open={true}
          onClose={() => setOpenModal(null)}
        />
      )}
      {openModal === "manager" && (
        <ChangeManagerModal
          personId={personId}
          open={true}
          onClose={() => setOpenModal(null)}
        />
      )}
      {openModal === "pay-plan" && (
        <ChangePayPlanModal
          personId={personId}
          open={true}
          onClose={() => setOpenModal(null)}
        />
      )}
      {openModal === "team" && (
        <AddToTeamModal
          personId={personId}
          open={true}
          onClose={() => setOpenModal(null)}
        />
      )}
      {openModal === "terminate" && (
        <TerminateModal
          personId={personId}
          open={true}
          onClose={() => setOpenModal(null)}
        />
      )}
      {openModal === "remove" && (
        <RemovePersonModal
          personId={personId}
          personName={personName}
          open={true}
          onClose={() => setOpenModal(null)}
        />
      )}
      {openModal === "create-repcard" && (
        <CreateRepcardAccountModal
          personId={personId}
          open={true}
          onClose={() => setOpenModal(null)}
        />
      )}
      {openModal === "deactivate-repcard" && (
        <DeactivateRepcardModal
          personId={personId}
          open={true}
          onClose={() => setOpenModal(null)}
        />
      )}
    </>
  );
}
