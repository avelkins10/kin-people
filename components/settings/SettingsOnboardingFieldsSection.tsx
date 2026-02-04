"use client";

import React, { useState, useEffect } from "react";
import {
  ClipboardList,
  Edit2,
  Trash2,
  GripVertical,
  X,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
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
  INFO_FIELD_TYPES,
  INFO_FIELD_CATEGORIES,
  type SelectOption,
} from "@/lib/db/schema/onboarding-info-fields";
import {
  SettingsSection,
  SettingsEmptyState,
  SettingsListSkeleton,
  SettingsAddButton,
} from "@/components/settings/shared";

interface InfoField {
  id: string;
  fieldName: string;
  fieldLabel: string;
  fieldType: string;
  fieldOptions: SelectOption[] | null;
  isRequired: boolean | null;
  category: string | null;
  displayOrder: number;
  isActive: boolean | null;
}

interface SettingsOnboardingFieldsSectionProps {
  onRefetch?: () => void;
}

const FIELD_TYPE_LABELS: Record<string, string> = {
  text: "Text",
  select: "Dropdown",
  date: "Date",
  phone: "Phone",
  address: "Address",
  email: "Email",
  number: "Number",
};

const CATEGORY_LABELS: Record<string, string> = {
  uniform: "Uniform / Sizing",
  emergency: "Emergency Contact",
  personal: "Personal Info",
  tax: "Tax Info",
  benefits: "Benefits",
};

function SortableFieldItem({
  field,
  onEdit,
  onDelete,
}: {
  field: InfoField;
  onEdit: (field: InfoField) => void;
  onDelete: (field: InfoField) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

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
              {field.fieldLabel}
            </span>
            {field.isRequired && (
              <span className="text-red-500 text-xs font-bold">*</span>
            )}
            <span className="bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded text-[10px] font-medium shrink-0">
              {FIELD_TYPE_LABELS[field.fieldType] || field.fieldType}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] font-medium text-gray-400">
              {field.fieldName}
            </span>
            {field.category && (
              <span className="text-[10px] font-medium text-gray-500">
                {CATEGORY_LABELS[field.category] || field.category}
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => onEdit(field)}
          aria-label={`Edit ${field.fieldLabel}`}
        >
          <Edit2 className="w-3 h-3 text-indigo-600" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => onDelete(field)}
          aria-label={`Delete ${field.fieldLabel}`}
        >
          <Trash2 className="w-3 h-3 text-red-600" />
        </Button>
      </div>
    </div>
  );
}

export function SettingsOnboardingFieldsSection({
  onRefetch,
}: SettingsOnboardingFieldsSectionProps) {
  const [fields, setFields] = useState<InfoField[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [editField, setEditField] = useState<InfoField | null>(null);
  const [deleteField, setDeleteField] = useState<InfoField | null>(null);

  // Form state
  const [formFieldName, setFormFieldName] = useState("");
  const [formFieldLabel, setFormFieldLabel] = useState("");
  const [formFieldType, setFormFieldType] = useState<string>("text");
  const [formCategory, setFormCategory] = useState<string>("");
  const [formIsRequired, setFormIsRequired] = useState(false);
  const [formOptions, setFormOptions] = useState<SelectOption[]>([]);
  const [newOptionValue, setNewOptionValue] = useState("");
  const [newOptionLabel, setNewOptionLabel] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetchFields();
  }, []);

  async function fetchFields() {
    setLoading(true);
    try {
      const res = await fetch("/api/onboarding-info-fields");
      if (!res.ok) throw new Error("Failed to fetch fields");
      const data = await res.json();
      setFields(data);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load info fields",
      });
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setFormFieldName("");
    setFormFieldLabel("");
    setFormFieldType("text");
    setFormCategory("");
    setFormIsRequired(false);
    setFormOptions([]);
    setNewOptionValue("");
    setNewOptionLabel("");
  }

  function openAdd() {
    resetForm();
    setAddOpen(true);
  }

  function openEdit(field: InfoField) {
    setFormFieldName(field.fieldName);
    setFormFieldLabel(field.fieldLabel);
    setFormFieldType(field.fieldType);
    setFormCategory(field.category || "");
    setFormIsRequired(field.isRequired || false);
    setFormOptions(field.fieldOptions || []);
    setEditField(field);
  }

  function addOption() {
    if (!newOptionValue.trim() || !newOptionLabel.trim()) return;
    setFormOptions([
      ...formOptions,
      { value: newOptionValue.trim(), label: newOptionLabel.trim() },
    ]);
    setNewOptionValue("");
    setNewOptionLabel("");
  }

  function removeOption(index: number) {
    setFormOptions(formOptions.filter((_, i) => i !== index));
  }

  // Generate field name from label
  function handleLabelChange(label: string) {
    setFormFieldLabel(label);
    // Only auto-generate if field name is empty or matches previous auto-generation
    const autoName = label
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .replace(/\s+/g, "_")
      .replace(/^_+|_+$/g, "");
    if (!formFieldName || formFieldName === generateAutoName(formFieldLabel)) {
      setFormFieldName(autoName);
    }
  }

  function generateAutoName(label: string): string {
    return label
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .replace(/\s+/g, "_")
      .replace(/^_+|_+$/g, "");
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const maxOrder = fields.length > 0 ? Math.max(...fields.map((f) => f.displayOrder)) : 0;
      const res = await fetch("/api/onboarding-info-fields", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fieldName: formFieldName.trim(),
          fieldLabel: formFieldLabel.trim(),
          fieldType: formFieldType,
          category: formCategory || null,
          isRequired: formIsRequired,
          fieldOptions: formFieldType === "select" ? formOptions : null,
          displayOrder: maxOrder + 1,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error || "Failed to create");
      }
      setAddOpen(false);
      resetForm();
      fetchFields();
      onRefetch?.();
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Error",
        description: e instanceof Error ? e.message : "Failed to create field",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editField) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/onboarding-info-fields/${editField.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fieldName: formFieldName.trim(),
          fieldLabel: formFieldLabel.trim(),
          fieldType: formFieldType,
          category: formCategory || null,
          isRequired: formIsRequired,
          fieldOptions: formFieldType === "select" ? formOptions : null,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error || "Failed to update");
      }
      setEditField(null);
      resetForm();
      fetchFields();
      onRefetch?.();
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Error",
        description: e instanceof Error ? e.message : "Failed to update field",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteField) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/onboarding-info-fields/${deleteField.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error || "Failed to delete");
      }
      setDeleteField(null);
      fetchFields();
      onRefetch?.();
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Error",
        description: e instanceof Error ? e.message : "Failed to delete field",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = fields.findIndex((f) => f.id === active.id);
      const newIndex = fields.findIndex((f) => f.id === over.id);

      const reorderedFields = arrayMove(fields, oldIndex, newIndex);
      setFields(reorderedFields);

      // Save the new order to the server (update each field's displayOrder)
      try {
        await Promise.all(
          reorderedFields.map((field, index) =>
            fetch(`/api/onboarding-info-fields/${field.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ displayOrder: index + 1 }),
            })
          )
        );
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to save field order",
        });
        // Revert on error
        fetchFields();
      }
    }
  }

  const FieldForm = ({ onSubmit, submitLabel }: { onSubmit: (e: React.FormEvent) => void; submitLabel: string }) => (
    <form onSubmit={onSubmit}>
      <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
        <div className="grid gap-2">
          <Label htmlFor="field-label">Label</Label>
          <Input
            id="field-label"
            value={formFieldLabel}
            onChange={(e) => handleLabelChange(e.target.value)}
            placeholder="e.g. Shirt Size"
            required
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="field-name">Field Name (system identifier)</Label>
          <Input
            id="field-name"
            value={formFieldName}
            onChange={(e) => setFormFieldName(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
            placeholder="e.g. shirt_size"
            required
            pattern="^[a-z][a-z0-9_]*$"
          />
          <p className="text-xs text-gray-500">Lowercase letters, numbers, and underscores only</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="field-type">Field Type</Label>
            <Select value={formFieldType} onValueChange={setFormFieldType}>
              <SelectTrigger id="field-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {INFO_FIELD_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {FIELD_TYPE_LABELS[type] || type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="field-category">Category</Label>
            <Select value={formCategory} onValueChange={setFormCategory}>
              <SelectTrigger id="field-category">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">None</SelectItem>
                {INFO_FIELD_CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {CATEGORY_LABELS[cat] || cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {formFieldType === "select" && (
          <div className="grid gap-2">
            <Label>Dropdown Options</Label>
            <div className="space-y-2">
              {formOptions.map((option, index) => (
                <div key={index} className="flex items-center gap-2 bg-gray-50 p-2 rounded">
                  <span className="flex-1 text-sm">
                    <span className="font-medium">{option.label}</span>
                    <span className="text-gray-400 ml-2">({option.value})</span>
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => removeOption(index)}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ))}
              <div className="flex gap-2">
                <Input
                  placeholder="Value"
                  value={newOptionValue}
                  onChange={(e) => setNewOptionValue(e.target.value)}
                  className="flex-1"
                />
                <Input
                  placeholder="Label"
                  value={newOptionLabel}
                  onChange={(e) => setNewOptionLabel(e.target.value)}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addOption}
                  disabled={!newOptionValue.trim() || !newOptionLabel.trim()}
                >
                  Add
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2">
          <Checkbox
            id="field-required"
            checked={formIsRequired}
            onCheckedChange={(checked) => setFormIsRequired(checked === true)}
          />
          <Label htmlFor="field-required" className="cursor-pointer">
            Required field
          </Label>
        </div>
      </div>
      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setAddOpen(false);
            setEditField(null);
          }}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={saving || !formFieldName.trim() || !formFieldLabel.trim()}>
          {saving ? "Saving..." : submitLabel}
        </Button>
      </DialogFooter>
    </form>
  );

  return (
    <SettingsSection
      icon={ClipboardList}
      title="Personal Info Fields"
      description="Configure what personal information to collect from new hires (e.g., uniform sizes, emergency contacts)."
      action={<SettingsAddButton onClick={openAdd} />}
    >
      {loading ? (
        <SettingsListSkeleton count={4} />
      ) : fields.length === 0 ? (
        <SettingsEmptyState
          icon={ClipboardList}
          title="No fields configured"
          description="Add fields to start collecting info from new hires"
          action={{ label: "Add Field", onClick: openAdd }}
        />
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={fields.map((f) => f.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {fields.map((field) => (
                <SortableFieldItem
                  key={field.id}
                  field={field}
                  onEdit={openEdit}
                  onDelete={setDeleteField}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Add Field Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Personal Info Field</DialogTitle>
          </DialogHeader>
          <FieldForm onSubmit={handleCreate} submitLabel="Create" />
        </DialogContent>
      </Dialog>

      {/* Edit Field Dialog */}
      <Dialog open={!!editField} onOpenChange={(open) => !open && setEditField(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Personal Info Field</DialogTitle>
          </DialogHeader>
          <FieldForm onSubmit={handleUpdate} submitLabel="Save" />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteField} onOpenChange={(open) => !open && setDeleteField(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete field?</AlertDialogTitle>
            <AlertDialogDescription>
              This will deactivate &quot;{deleteField?.fieldLabel}&quot;. Existing data will be preserved,
              but new hires won&apos;t see this field.
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
