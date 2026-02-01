"use client";

import { useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  closestCorners,
  useSensor,
  useSensors,
  PointerSensor,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useDroppable } from "@dnd-kit/core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RecruitDetailModal } from "@/components/recruiting/modals/recruit-detail-modal";
import type { RecruitListItem } from "@/types/recruiting";
import { useRouter } from "next/navigation";

interface RecruitingKanbanProps {
  initialRecruits: RecruitListItem[];
}

type RecruitStatus =
  | "lead"
  | "contacted"
  | "interviewing"
  | "offer_sent"
  | "agreement_sent"
  | "agreement_signed";

const STATUS_COLUMNS: { status: RecruitStatus; label: string; color: string }[] =
  [
    { status: "lead", label: "Lead", color: "bg-gray-100" },
    { status: "contacted", label: "Contacted", color: "bg-blue-100" },
    { status: "interviewing", label: "Interviewing", color: "bg-yellow-100" },
    { status: "offer_sent", label: "Offer Sent", color: "bg-purple-100" },
    { status: "agreement_sent", label: "Agreement Sent", color: "bg-orange-100" },
    {
      status: "agreement_signed",
      label: "Agreement Signed",
      color: "bg-green-100",
    },
  ];

function RecruitCard({
  recruit,
  onClick,
}: {
  recruit: RecruitListItem;
  onClick: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: recruit.recruit.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const daysInStatus = recruit.recruit.updatedAt
    ? Math.floor(
        (new Date().getTime() - new Date(recruit.recruit.updatedAt).getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : 0;

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Card
        className="mb-2 cursor-move hover:shadow-md transition-shadow"
        onClick={onClick}
      >
        <CardContent className="p-3">
          <div className="font-medium text-sm">
            {recruit.recruit.firstName} {recruit.recruit.lastName}
          </div>
          {recruit.targetOffice && (
            <div className="text-xs text-gray-600 mt-1">
              {recruit.targetOffice.name}
            </div>
          )}
          {recruit.targetRole && (
            <div className="text-xs text-gray-600">
              {recruit.targetRole.name}
            </div>
          )}
          <div className="text-xs text-gray-500 mt-2">
            {daysInStatus} day{daysInStatus !== 1 ? "s" : ""} in status
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Column({
  status,
  label,
  color,
  recruits,
  onRecruitClick,
}: {
  status: RecruitStatus;
  label: string;
  color: string;
  recruits: RecruitListItem[];
  onRecruitClick: (recruit: RecruitListItem) => void;
}) {
  const { setNodeRef } = useDroppable({
    id: status,
  });

  const sortableRecruits = recruits.filter(
    (r) => r.recruit.status === status
  );

  return (
    <div className="flex-1 min-w-[250px]">
      <Card className={`${color} border-2`}>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center justify-between">
            <span>{label}</span>
            <Badge variant="secondary" className="ml-2">
              {sortableRecruits.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent ref={setNodeRef}>
          <SortableContext
            items={sortableRecruits.map((r) => r.recruit.id)}
            strategy={verticalListSortingStrategy}
          >
            <div>
              {sortableRecruits.map((recruit) => (
                <RecruitCard
                  key={recruit.recruit.id}
                  recruit={recruit}
                  onClick={() => onRecruitClick(recruit)}
                />
              ))}
              {sortableRecruits.length === 0 && (
                <div className="text-sm text-gray-400 text-center py-8">
                  No recruits
                </div>
              )}
            </div>
          </SortableContext>
        </CardContent>
      </Card>
    </div>
  );
}

export function RecruitingKanban({ initialRecruits }: RecruitingKanbanProps) {
  const [recruits, setRecruits] = useState<RecruitListItem[]>(initialRecruits);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selectedRecruit, setSelectedRecruit] =
    useState<RecruitListItem | null>(null);
  const router = useRouter();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const recruitId = active.id as string;
    
    // Determine the target status from the droppable
    // If over.id is a valid status (column droppable), use it
    // If over.id is a recruit ID (card), find the card's parent column status
    let newStatus: RecruitStatus | null = null;
    const validStatuses = STATUS_COLUMNS.map(col => col.status);
    
    if (validStatuses.includes(over.id as RecruitStatus)) {
      // Dropped directly on a column
      newStatus = over.id as RecruitStatus;
    } else {
      // Dropped on a card - find which column that card belongs to
      const overRecruit = recruits.find((r) => r.recruit.id === over.id);
      if (overRecruit) {
        newStatus = overRecruit.recruit.status as RecruitStatus | null;
      } else {
        // Invalid drop target
        return;
      }
    }

    if (!newStatus) return;

    // Find the recruit
    const recruit = recruits.find((r) => r.recruit.id === recruitId);
    if (!recruit) return;

    // Don't update if status hasn't changed
    if (recruit.recruit.status === newStatus) return;

    // Optimistically update UI
    setRecruits((prev) =>
      prev.map((r) =>
        r.recruit.id === recruitId
          ? { ...r, recruit: { ...r.recruit, status: newStatus } }
          : r
      )
    );

    // Update status via API
    try {
      const response = await fetch(`/api/recruits/${recruitId}/update-status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newStatus }),
      });

      if (!response.ok) {
        // Revert on error
        setRecruits((prev) =>
          prev.map((r) =>
            r.recruit.id === recruitId
              ? { ...r, recruit: { ...r.recruit, status: recruit.recruit.status } }
              : r
          )
        );
        throw new Error("Failed to update status");
      }

      // Refresh data
      router.refresh();
    } catch (error) {
      console.error("Error updating recruit status:", error);
      alert("Failed to update recruit status");
    }
  };

  const activeRecruit = activeId
    ? recruits.find((r) => r.recruit.id === activeId)
    : null;

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          {STATUS_COLUMNS.map((column) => (
            <Column
              key={column.status}
              status={column.status}
              label={column.label}
              color={column.color}
              recruits={recruits}
              onRecruitClick={setSelectedRecruit}
            />
          ))}
        </div>
        <DragOverlay>
          {activeRecruit ? (
            <Card className="w-[250px] opacity-90">
              <CardContent className="p-3">
                <div className="font-medium text-sm">
                  {activeRecruit.recruit.firstName}{" "}
                  {activeRecruit.recruit.lastName}
                </div>
                {activeRecruit.targetOffice && (
                  <div className="text-xs text-gray-600 mt-1">
                    {activeRecruit.targetOffice.name}
                  </div>
                )}
              </CardContent>
            </Card>
          ) : null}
        </DragOverlay>
      </DndContext>

      {selectedRecruit && (
        <RecruitDetailModal
          recruitId={selectedRecruit.recruit.id}
          open={!!selectedRecruit}
          onClose={() => setSelectedRecruit(null)}
        />
      )}
    </>
  );
}
