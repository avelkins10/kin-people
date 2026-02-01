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

interface PersonActionMenuProps {
  personId: string;
}

export function PersonActionMenu({ personId }: PersonActionMenuProps) {
  const [openModal, setOpenModal] = useState<string | null>(null);

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
          <DropdownMenuItem
            onClick={() => setOpenModal("terminate")}
            className="text-red-600"
          >
            Terminate
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
    </>
  );
}
