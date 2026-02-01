"use client";

import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { OrgTreeNode, RelationshipType } from "@/types/org-chart";
import { OrgNodeQuickActions } from "./org-node-quick-actions";

interface OrgTreeNodeProps {
  node: OrgTreeNode;
  level: number;
  isExpanded: boolean;
  onToggle: () => void;
  isHighlighted?: boolean;
  relationshipType: RelationshipType;
}

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
        isHighlighted && "ring-2 ring-blue-500"
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

        {/* Avatar */}
        <Avatar className="h-10 w-10 shrink-0">
          <AvatarImage src={node.person.profileImageUrl || undefined} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>

        {/* Person Info */}
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-gray-900">
            {node.person.firstName} {node.person.lastName}
          </div>
          <div className="text-sm text-gray-600">{node.person.roleName || "-"}</div>
          <div className="text-xs text-gray-500">
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
