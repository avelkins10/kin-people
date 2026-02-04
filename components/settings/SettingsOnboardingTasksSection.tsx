"use client";

import React, { useState, useEffect } from "react";
import {
  GraduationCap,
  Edit2,
  Trash2,
  GripVertical,
  User,
  Shield,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  TASK_TYPES,
  TASK_CATEGORIES,
  ASSIGNEE_TYPES,
} from "@/lib/db/schema/onboarding-tasks";
import {
  SettingsSection,
  SettingsEmptyState,
  SettingsListSkeleton,
  SettingsAddButton,
} from "@/components/settings/shared";

interface OnboardingTask {
  id: string;
  title: string;
  description: string | null;
  taskOrder: number;
  category: string;
  isActive: boolean;
  taskType: string | null;
  requiresInput: boolean | null;
  inputFields: unknown;
  isAutomated: boolean | null;
  automationType: string | null;
  automationConfig: unknown;
  assigneeType: string | null;
  dueDays: number | null;
  blockedBy: string[] | null;
}

interface SettingsOnboardingTasksSectionProps {
  onRefetch?: () => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  admin: "Admin / HR",
  training: "Training",
  equipment: "Equipment",
  software: "Software Access",
  personal_info: "Personal Info",
  meeting: "Meetings",
  setup: "Setup",
};

const TASK_TYPE_LABELS: Record<string, string> = {
  manual: "Manual (Checkbox)",
  info_collection: "Info Collection",
  automated: "Automated",
  document: "Document",
  meeting: "Meeting",
};

const ASSIGNEE_TYPE_LABELS: Record<string, string> = {
  new_hire: "New Hire",
  manager: "Manager",
  admin: "Admin / HR",
};

const ASSIGNEE_ICONS: Record<string, React.ReactNode> = {
  new_hire: <User className="w-3 h-3" />,
  manager: <Shield className="w-3 h-3" />,
  admin: <GraduationCap className="w-3 h-3" />,
};

function SortableTaskItem({
  task,
  onEdit,
  onDelete,
}: {
  task: OnboardingTask;
  onEdit: (task: OnboardingTask) => void;
  onDelete: (task: OnboardingTask) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const assignee = task.assigneeType || "new_hire";

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center justify-between p-4 bg-gray-50 rounded-sm border border-transparent transition-all duration-150 hover:bg-white hover:border-gray-200 hover:shadow-sm group"
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab touch-none text-gray-400 hover:text-gray-600"
          aria-label="Drag to reorder"
        >
          <GripVertical className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-gray-700 truncate">
              {task.title}
            </span>
            <span className="bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded text-[10px] font-medium uppercase shrink-0">
              {CATEGORY_LABELS[task.category] || task.category}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] font-medium text-gray-400 flex items-center gap-1">
              {ASSIGNEE_ICONS[assignee]}
              {ASSIGNEE_TYPE_LABELS[assignee] || assignee}
            </span>
            {task.dueDays !== null && (
              <span className="text-[10px] font-medium text-gray-400 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Due in {task.dueDays} days
              </span>
            )}
            <span className="text-[10px] font-medium text-indigo-500">
              {TASK_TYPE_LABELS[task.taskType || "manual"] || task.taskType}
            </span>
          </div>
        </div>
      </div>
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => onEdit(task)}
          aria-label={`Edit ${task.title}`}
        >
          <Edit2 className="w-3 h-3 text-indigo-600" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => onDelete(task)}
          aria-label={`Delete ${task.title}`}
        >
          <Trash2 className="w-3 h-3 text-red-600" />
        </Button>
      </div>
    </div>
  );
}

export function SettingsOnboardingTasksSection({
  onRefetch,
}: SettingsOnboardingTasksSectionProps) {
  const [tasks, setTasks] = useState<OnboardingTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [editTask, setEditTask] = useState<OnboardingTask | null>(null);
  const [deleteTask, setDeleteTask] = useState<OnboardingTask | null>(null);

  // Form state
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formCategory, setFormCategory] = useState<string>("admin");
  const [formTaskType, setFormTaskType] = useState<string>("manual");
  const [formAssigneeType, setFormAssigneeType] = useState<string>("new_hire");
  const [formDueDays, setFormDueDays] = useState<string>("");

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetchTasks();
  }, []);

  async function fetchTasks() {
    setLoading(true);
    try {
      const res = await fetch("/api/onboarding-tasks");
      if (!res.ok) throw new Error("Failed to fetch tasks");
      const data = await res.json();
      setTasks(data);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load onboarding tasks",
      });
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setFormTitle("");
    setFormDescription("");
    setFormCategory("admin");
    setFormTaskType("manual");
    setFormAssigneeType("new_hire");
    setFormDueDays("");
  }

  function openAdd() {
    resetForm();
    setAddOpen(true);
  }

  function openEdit(task: OnboardingTask) {
    setFormTitle(task.title);
    setFormDescription(task.description || "");
    setFormCategory(task.category);
    setFormTaskType(task.taskType || "manual");
    setFormAssigneeType(task.assigneeType || "new_hire");
    setFormDueDays(task.dueDays?.toString() || "");
    setEditTask(task);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const maxOrder = tasks.length > 0 ? Math.max(...tasks.map((t) => t.taskOrder)) : 0;
      const res = await fetch("/api/onboarding-tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formTitle.trim(),
          description: formDescription.trim() || null,
          category: formCategory,
          taskOrder: maxOrder + 1,
          taskType: formTaskType,
          assigneeType: formAssigneeType,
          dueDays: formDueDays ? parseInt(formDueDays, 10) : null,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error || "Failed to create");
      }
      setAddOpen(false);
      resetForm();
      fetchTasks();
      onRefetch?.();
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Error",
        description: e instanceof Error ? e.message : "Failed to create task",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editTask) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/onboarding-tasks/${editTask.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formTitle.trim(),
          description: formDescription.trim() || null,
          category: formCategory,
          taskType: formTaskType,
          assigneeType: formAssigneeType,
          dueDays: formDueDays ? parseInt(formDueDays, 10) : null,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error || "Failed to update");
      }
      setEditTask(null);
      resetForm();
      fetchTasks();
      onRefetch?.();
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Error",
        description: e instanceof Error ? e.message : "Failed to update task",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTask) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/onboarding-tasks/${deleteTask.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error || "Failed to delete");
      }
      setDeleteTask(null);
      fetchTasks();
      onRefetch?.();
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Error",
        description: e instanceof Error ? e.message : "Failed to delete task",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = tasks.findIndex((t) => t.id === active.id);
      const newIndex = tasks.findIndex((t) => t.id === over.id);

      const reorderedTasks = arrayMove(tasks, oldIndex, newIndex);
      setTasks(reorderedTasks);

      // Save the new order to the server
      try {
        const res = await fetch("/api/onboarding-tasks/reorder", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            taskIds: reorderedTasks.map((t) => t.id),
          }),
        });
        if (!res.ok) {
          throw new Error("Failed to save order");
        }
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to save task order",
        });
        // Revert on error
        fetchTasks();
      }
    }
  }

  const TaskForm = ({ onSubmit, submitLabel }: { onSubmit: (e: React.FormEvent) => void; submitLabel: string }) => (
    <form onSubmit={onSubmit}>
      <div className="grid gap-4 py-4">
        <div className="grid gap-2">
          <Label htmlFor="task-title">Title</Label>
          <Input
            id="task-title"
            value={formTitle}
            onChange={(e) => setFormTitle(e.target.value)}
            placeholder="e.g. Complete I-9 Form"
            required
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="task-description">Description</Label>
          <Textarea
            id="task-description"
            value={formDescription}
            onChange={(e) => setFormDescription(e.target.value)}
            placeholder="Brief description of the task"
            rows={2}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="task-category">Category</Label>
            <Select value={formCategory} onValueChange={setFormCategory}>
              <SelectTrigger id="task-category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TASK_CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {CATEGORY_LABELS[cat] || cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="task-type">Task Type</Label>
            <Select value={formTaskType} onValueChange={setFormTaskType}>
              <SelectTrigger id="task-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TASK_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {TASK_TYPE_LABELS[type] || type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="task-assignee">Assignee</Label>
            <Select value={formAssigneeType} onValueChange={setFormAssigneeType}>
              <SelectTrigger id="task-assignee">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ASSIGNEE_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {ASSIGNEE_TYPE_LABELS[type] || type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="task-due-days">Due Days (optional)</Label>
            <Input
              id="task-due-days"
              type="number"
              min="0"
              value={formDueDays}
              onChange={(e) => setFormDueDays(e.target.value)}
              placeholder="Days from hire"
            />
          </div>
        </div>
      </div>
      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setAddOpen(false);
            setEditTask(null);
          }}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={saving || !formTitle.trim()}>
          {saving ? "Saving..." : submitLabel}
        </Button>
      </DialogFooter>
    </form>
  );

  return (
    <SettingsSection
      icon={GraduationCap}
      title="Onboarding Tasks"
      description="Drag to reorder tasks. These are assigned to new hires when they enter onboarding."
      action={<SettingsAddButton onClick={openAdd} />}
    >
      {loading ? (
        <SettingsListSkeleton count={4} />
      ) : tasks.length === 0 ? (
        <SettingsEmptyState
          icon={GraduationCap}
          title="No tasks yet"
          description="Add onboarding tasks to assign to new hires"
          action={{ label: "Add Task", onClick: openAdd }}
        />
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {tasks.map((task) => (
                <SortableTaskItem
                  key={task.id}
                  task={task}
                  onEdit={openEdit}
                  onDelete={setDeleteTask}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Add Task Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Onboarding Task</DialogTitle>
          </DialogHeader>
          <TaskForm onSubmit={handleCreate} submitLabel="Create" />
        </DialogContent>
      </Dialog>

      {/* Edit Task Dialog */}
      <Dialog open={!!editTask} onOpenChange={(open) => !open && setEditTask(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Onboarding Task</DialogTitle>
          </DialogHeader>
          <TaskForm onSubmit={handleUpdate} submitLabel="Save" />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTask} onOpenChange={(open) => !open && setDeleteTask(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete task?</AlertDialogTitle>
            <AlertDialogDescription>
              This will deactivate &quot;{deleteTask?.title}&quot;. People currently in onboarding
              will keep their progress for this task, but new hires won&apos;t receive it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={saving} className="bg-red-600">
              {saving ? "Deleting..." : "Deactivate"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SettingsSection>
  );
}
