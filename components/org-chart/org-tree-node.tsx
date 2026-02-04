"use client";

import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import type { OrgTreeNode, RelationshipType, PersonStatus } from "@/types/org-chart";
import { OrgNodeQuickActions } from "./org-node-quick-actions";

interface OrgTreeNodeProps {
  node: OrgTreeNode;
  level: number;
  isExpanded: boolean;
  onToggle: () => void;
  isHighlighted?: boolean;
  relationshipType: RelationshipType;
}

// Status dot colors
const STATUS_COLORS: Record<PersonStatus, string> = {
  active: "bg-green-500",
  onboarding: "bg-yellow-500",
  inactive: "bg-gray-400",
  terminated: "bg-red-500",
};

const STATUS_LABELS: Record<PersonStatus, string> = {
  active: "Active",
  onboarding: "Onboarding",
  inactive: "Inactive",
  terminated: "Terminated",
};

export function OrgTreeNode({
  node,
  level,
  isExpanded,
  onToggle,
  isHighlighted = false,
  relationshipType,
}: OrgTreeNodeProps) {
  const router = useRouter();
  const hasChildren = node.children.length > 0;

  const initials = `${node.person.firstName?.[0] || ""}${
    node.person.lastName?.[0] || ""
  }`.toUpperCase();

  const status = (node.person.status || "active") as PersonStatus;
  const statusColor = STATUS_COLORS[status] || STATUS_COLORS.active;
  const statusLabel = STATUS_LABELS[status] || "Unknown";
  const directReportCount = node.person.directReportCount || 0;

  const handleNodeClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on expand button or quick actions
    if (
      (e.target as HTMLElement).closest("button") ||
      (e.target as HTMLElement).closest("[role='menu']")
    ) {
      return;
    }
    router.push(`/people/${node.person.id}`);
  };

  return (
    <div
      className={cn(
        "group relative flex items-center gap-3 rounded-lg border bg-white p-3 shadow-sm transition-all hover:shadow-md cursor-pointer",
        isHighlighted && "ring-2 ring-blue-500 bg-blue-50"
      )}
      onClick={handleNodeClick}
    >
      {/* Expand/Collapse button */}
      {hasChildren && (
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 shrink-0"
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
        >
          {isExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </Button>
      )}
      {!hasChildren && <div className="w-6" />}

      {/* Avatar with status indicator */}
      <div className="relative shrink-0">
        <Avatar className="h-10 w-10">
          <AvatarImage src={node.person.profileImageUrl || undefined} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        {/* Status dot */}
        <div
          className={cn(
            "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white",
            statusColor
          )}
          title={statusLabel}
        />
      </div>

      {/* Person Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-gray-900 truncate">
            {node.person.firstName} {node.person.lastName}
          </span>
          {/* Direct report count badge */}
          {directReportCount > 0 && (
            <Badge
              variant="secondary"
              className="text-xs px-1.5 py-0 h-5 shrink-0"
              title={`${directReportCount} direct report${directReportCount !== 1 ? "s" : ""}`}
            >
              <Users className="w-3 h-3 mr-0.5" />
              {directReportCount}
            </Badge>
          )}
        </div>
        <div className="text-sm text-gray-600 truncate">
          {node.person.roleName || "-"}
          {node.person.roleLevel && (
            <span className="text-gray-400 ml-1">(L{node.person.roleLevel})</span>
          )}
        </div>
        <div className="text-xs text-gray-500 truncate">
          {node.person.officeName || "-"}
        </div>
      </div>

      {/* Quick Actions */}
      <OrgNodeQuickActions
        personId={node.person.id}
        personName={`${node.person.firstName} ${node.person.lastName}`}
      />
    </div>
  );
}
