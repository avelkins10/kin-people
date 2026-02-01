"use client";

import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreVertical, User, UserCog, Users } from "lucide-react";
import { ChangeManagerModal } from "@/components/people/modals/change-manager-modal";
import { useState, useEffect } from "react";
import { Permission } from "@/lib/permissions/types";
import { getRolePermissions } from "@/lib/permissions/roles";

interface OrgNodeQuickActionsProps {
  personId: string;
  personName: string;
}

interface UserData {
  user: {
    id: string;
    roleName: string;
  };
  permissions: string[];
}

export function OrgNodeQuickActions({
  personId,
  personName,
}: OrgNodeQuickActionsProps) {
  const router = useRouter();
  const [showChangeManager, setShowChangeManager] = useState(false);
  const [canManageTeam, setCanManageTeam] = useState(false);

  useEffect(() => {
    async function checkPermissions() {
      try {
        const response = await fetch("/api/auth/me");
        if (response.ok) {
          const data: UserData = await response.json();
          const permissions = data.permissions || [];
          setCanManageTeam(
            permissions.includes(Permission.MANAGE_OWN_TEAM) ||
              permissions.includes(Permission.MANAGE_OWN_OFFICE) ||
              permissions.includes(Permission.MANAGE_ALL_OFFICES)
          );
        }
      } catch (error) {
        console.error("Error checking permissions:", error);
      }
    }
    checkPermissions();
  }, []);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={() => router.push(`/people/${personId}`)}
          >
            <User className="h-4 w-4 mr-2" />
            View Profile
          </DropdownMenuItem>
          {canManageTeam && (
            <DropdownMenuItem onClick={() => setShowChangeManager(true)}>
              <UserCog className="h-4 w-4 mr-2" />
              Change Manager
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            onClick={() => router.push(`/people?manager=${personId}`)}
          >
            <Users className="h-4 w-4 mr-2" />
            View Team
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {showChangeManager && (
        <ChangeManagerModal
          personId={personId}
          open={showChangeManager}
          onClose={() => setShowChangeManager(false)}
        />
      )}
    </>
  );
}
