"use client";

import { useState, useEffect } from "react";
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
import { Badge } from "@/components/ui/badge";
import { RecruitDetailModal } from "@/components/recruiting/modals/recruit-detail-modal";
import type { RecruitListItem } from "@/types/recruiting";
import { useRouter } from "next/navigation";
import { Clock, MapPin, MoreHorizontal, Plus, UserPlus, Phone, Users, FileText, Send, CheckCircle } from "lucide-react";

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

const STATUS_COLUMNS: { status: RecruitStatus; label: string; icon: React.ElementType }[] = [
  { status: "lead", label: "Lead", icon: UserPlus },
  { status: "contacted", label: "Contacted", icon: Phone },
  { status: "interviewing", label: "Interviewing", icon: Users },
  { status: "offer_sent", label: "Offer Sent", icon: FileText },
  { status: "agreement_sent", label: "Agreement Sent", icon: Send },
  { status: "agreement_signed", label: "Agreement Signed", icon: CheckCircle },
];

const PRIORITY_COLORS: Record<string, { bg: string; text: string }> = {
  high: { bg: "bg-red-100", text: "text-red-700" },
  medium: { bg: "bg-yellow-100", text: "text-yellow-700" },
  low: { bg: "bg-gray-100", text: "text-gray-600" },
};

const SOURCE_COLORS: Record<string, { bg: string; text: string }> = {
  linkedin: { bg: "bg-blue-100", text: "text-blue-700" },
  indeed: { bg: "bg-indigo-100", text: "text-indigo-700" },
  ziprecruiter: { bg: "bg-green-100", text: "text-green-700" },
  referral: { bg: "bg-purple-100", text: "text-purple-700" },
  direct: { bg: "bg-gray-100", text: "text-gray-700" },
};

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

  const priority = (recruit.recruit as { priority?: string }).priority || "medium";
  const source = (recruit.recruit as { source?: string }).source || "direct";
  const priorityStyle = PRIORITY_COLORS[priority] || PRIORITY_COLORS.medium;
  const sourceStyle = SOURCE_COLORS[source.toLowerCase()] || SOURCE_COLORS.direct;

  const initials = `${recruit.recruit.firstName?.[0] || ""}${recruit.recruit.lastName?.[0] || ""}`.toUpperCase();

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <div
        className="bg-white border border-gray-100 rounded-sm p-4 mb-3 cursor-move hover:shadow-md hover:border-gray-200 transition-all group"
        onClick={onClick}
      >
        {/* Header with name and priority */}
        <div className="flex items-start justify-between mb-2">
          <div>
            <div className="font-bold text-sm text-gray-900">
              {recruit.recruit.firstName} {recruit.recruit.lastName}
            </div>
            <div className="text-xs text-gray-500 mt-0.5">
              {recruit.targetRole?.name || "Sales Rep"}
            </div>
          </div>
          <Badge
            className={`${priorityStyle.bg} ${priorityStyle.text} border-0 text-[10px] font-bold uppercase`}
          >
            {priority}
          </Badge>
        </div>

        {/* Location */}
        {recruit.targetOffice && (
          <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-3">
            <MapPin className="w-3 h-3" />
            {recruit.targetOffice.name}
          </div>
        )}

        {/* Stuck indicator bar */}
        {daysInStatus > 5 && (
          <div className="w-full h-1 bg-red-400 rounded-full mb-3" />
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-50">
          <div className="flex items-center gap-2">
            {/* Recruiter avatar */}
            <div className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center text-[10px] font-bold">
              {initials || "MR"}
            </div>
            {/* Source badge */}
            <Badge
              className={`${sourceStyle.bg} ${sourceStyle.text} border-0 text-[10px] font-bold uppercase`}
            >
              {source}
            </Badge>
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <Clock className="w-3 h-3" />
            {daysInStatus}d
          </div>
        </div>
      </div>
    </div>
  );
}

function Column({
  status,
  label,
  icon: Icon,
  recruits,
  onRecruitClick,
}: {
  status: RecruitStatus;
  label: string;
  icon: React.ElementType;
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
    <div className="flex-1 min-w-[280px]">
      {/* Column Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-gray-400" />
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">
            {label}
          </span>
          <span className="text-xs font-bold text-gray-400">
            {sortableRecruits.length}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button className="p-1 hover:bg-gray-100 rounded-sm transition-colors">
            <Plus className="w-4 h-4 text-gray-400" />
          </button>
          <button className="p-1 hover:bg-gray-100 rounded-sm transition-colors">
            <MoreHorizontal className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </div>

      {/* Cards Container */}
      <div ref={setNodeRef} className="min-h-[200px]">
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
              <div className="text-sm text-gray-400 text-center py-8 border-2 border-dashed border-gray-100 rounded-sm">
                No recruits
              </div>
            )}
          </div>
        </SortableContext>
      </div>
    </div>
  );
}

export function RecruitingKanban({ initialRecruits }: RecruitingKanbanProps) {
  const [recruits, setRecruits] = useState<RecruitListItem[]>(initialRecruits);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    setRecruits(initialRecruits);
  }, [initialRecruits]);
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
    
    let newStatus: RecruitStatus | null = null;
    const validStatuses = STATUS_COLUMNS.map(col => col.status);
    
    if (validStatuses.includes(over.id as RecruitStatus)) {
      newStatus = over.id as RecruitStatus;
    } else {
      const overRecruit = recruits.find((r) => r.recruit.id === over.id);
      if (overRecruit) {
        newStatus = overRecruit.recruit.status as RecruitStatus | null;
      } else {
        return;
      }
    }

    if (!newStatus) return;

    const recruit = recruits.find((r) => r.recruit.id === recruitId);
    if (!recruit) return;

    if (recruit.recruit.status === newStatus) return;

    setRecruits((prev) =>
      prev.map((r) =>
        r.recruit.id === recruitId
          ? { ...r, recruit: { ...r.recruit, status: newStatus } }
          : r
      )
    );

    try {
      const response = await fetch(`/api/recruits/${recruitId}/update-status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newStatus }),
      });

      if (!response.ok) {
        setRecruits((prev) =>
          prev.map((r) =>
            r.recruit.id === recruitId
              ? { ...r, recruit: { ...r.recruit, status: recruit.recruit.status } }
              : r
          )
        );
        throw new Error("Failed to update status");
      }

      window.dispatchEvent(new CustomEvent("recruits-updated"));
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
        <div className="flex gap-6 overflow-x-auto pb-4">
          {STATUS_COLUMNS.map((column) => (
            <Column
              key={column.status}
              status={column.status}
              label={column.label}
              icon={column.icon}
              recruits={recruits}
              onRecruitClick={setSelectedRecruit}
            />
          ))}
        </div>
        <DragOverlay>
          {activeRecruit ? (
            <div className="w-[280px] bg-white border border-gray-200 rounded-sm p-4 shadow-lg opacity-95">
              <div className="font-bold text-sm">
                {activeRecruit.recruit.firstName} {activeRecruit.recruit.lastName}
              </div>
              {activeRecruit.targetOffice && (
                <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {activeRecruit.targetOffice.name}
                </div>
              )}
            </div>
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
