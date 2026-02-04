"use client";

import React, { useState } from "react";
import { Shield, Edit2, Trash2 } from "lucide-react";
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
import type { Role } from "@/hooks/use-settings-data";
import { Permission } from "@/lib/permissions/types";
import { getRolePermissions } from "@/lib/permissions/roles";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { roleFormSchema, type RoleFormData } from "@/lib/validation/role-form";
import {
  SettingsSection,
  SettingsListItem,
  SettingsEmptyState,
  SettingsListSkeleton,
  SettingsAddButton,
} from "@/components/settings/shared";

interface SettingsRolesSectionProps {
  roles: Role[];
  loading: boolean;
  onRefetch: () => void;
}

export function SettingsRolesSection({
  roles,
  loading,
  onRefetch,
}: SettingsRolesSectionProps) {
  const [addOpen, setAddOpen] = useState(false);
  const [editRole, setEditRole] = useState<Role | null>(null);
  const [deleteRole, setDeleteRole] = useState<Role | null>(null);
  const [saving, setSaving] = useState(false);

  const allPermissions = Object.values(Permission) as string[];
  const formatPermissionLabel = (p: string) =>
    p.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

  const addForm = useForm<RoleFormData>({
    resolver: zodResolver(roleFormSchema),
    defaultValues: {
      name: "",
      level: 1,
      description: "",
      permissions: [],
    },
  });

  const editForm = useForm<RoleFormData>({
    resolver: zodResolver(roleFormSchema),
    defaultValues: {
      name: "",
      level: 1,
      description: "",
      permissions: [],
    },
  });

  const addPermissions = addForm.watch("permissions") || [];
  const editPermissions = editForm.watch("permissions") || [];

  const openAdd = () => {
    addForm.reset({
      name: "",
      level: 1,
      description: "",
      permissions: [],
    });
    setAddOpen(true);
  };

  const openEdit = (role: Role) => {
    setEditRole(role);
    editForm.reset({
      name: role.name,
      level: role.level,
      description: role.description ?? "",
      permissions:
        Array.isArray(role.permissions) && role.permissions.length > 0
          ? (role.permissions as string[])
          : getRolePermissions(role.name),
    });
  };

  async function handleCreate(data: RoleFormData) {
    setSaving(true);
    try {
      const res = await fetch("/api/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name.trim(),
          level: data.level,
          description: data.description?.trim() || undefined,
          permissions: data.permissions && data.permissions.length > 0 ? data.permissions : undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error || "Failed to create");
      }
      setAddOpen(false);
      addForm.reset();
      onRefetch();
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Error",
        description: e instanceof Error ? e.message : "Failed to create role",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdate(data: RoleFormData) {
    if (!editRole) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/roles/${editRole.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name.trim(),
          level: data.level,
          description: data.description?.trim() || null,
          permissions: data.permissions || [],
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error || "Failed to update");
      }
      setEditRole(null);
      editForm.reset();
      onRefetch();
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Error",
        description: e instanceof Error ? e.message : "Failed to update role",
      });
    } finally {
      setSaving(false);
    }
  }

  const handleDelete = async () => {
    if (!deleteRole) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/roles/${deleteRole.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error || "Failed to delete");
      }
      setDeleteRole(null);
      onRefetch();
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Error",
        description: e instanceof Error ? e.message : "Failed to delete role",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <SettingsSection
      icon={Shield}
      title="Roles"
      description="Define roles and their permission levels"
      action={<SettingsAddButton onClick={openAdd} />}
    >
      <div className="space-y-3">
        {loading ? (
          <SettingsListSkeleton count={3} />
        ) : roles.length === 0 ? (
          <SettingsEmptyState
            icon={Shield}
            title="No roles yet"
            description="Add your first role to get started"
            action={{ label: "Add Role", onClick: openAdd }}
          />
        ) : (
          roles.map((role) => (
            <SettingsListItem
              key={role.id}
              title={role.name}
              subtitle={`Level ${role.level}${role.description ? ` · ${role.description}` : ""}`}
              actions={
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => openEdit(role)}
                    aria-label={`Edit ${role.name}`}
                  >
                    <Edit2 className="w-3 h-3 text-indigo-600" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setDeleteRole(role)}
                    aria-label={`Delete ${role.name}`}
                  >
                    <Trash2 className="w-3 h-3 text-red-600" />
                  </Button>
                </>
              }
            />
          ))
        )}
      </div>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add role</DialogTitle>
          </DialogHeader>
          <form onSubmit={addForm.handleSubmit(handleCreate)}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="add-role-name">Name</Label>
                <Input
                  id="add-role-name"
                  {...addForm.register("name")}
                  placeholder="e.g. Sales Rep"
                />
                {addForm.formState.errors.name && (
                  <p className="text-sm text-destructive">
                    {addForm.formState.errors.name.message}
                  </p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="add-role-level">Level (1 = lowest)</Label>
                <Input
                  id="add-role-level"
                  type="number"
                  min={1}
                  {...addForm.register("level", { valueAsNumber: true })}
                />
                {addForm.formState.errors.level && (
                  <p className="text-sm text-destructive">
                    {addForm.formState.errors.level.message}
                  </p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="add-role-desc">Description (optional)</Label>
                <Input
                  id="add-role-desc"
                  {...addForm.register("description")}
                  placeholder="Brief description"
                />
                {addForm.formState.errors.description && (
                  <p className="text-sm text-destructive">
                    {addForm.formState.errors.description.message}
                  </p>
                )}
              </div>
              <div className="grid gap-2">
                <Label>Permissions (optional)</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 border border-gray-100 rounded-sm">
                  {allPermissions.map((p) => (
                    <label
                      key={p}
                      className="flex items-center gap-2 text-sm cursor-pointer"
                    >
                      <Checkbox
                        checked={addPermissions.includes(p)}
                        onCheckedChange={(checked) => {
                          const current = addForm.getValues("permissions") || [];
                          addForm.setValue(
                            "permissions",
                            checked ? [...current, p] : current.filter((x) => x !== p)
                          );
                        }}
                      />
                      <span className="text-gray-700">{formatPermissionLabel(p)}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={addForm.formState.isSubmitting || saving}
              >
                {saving ? "Saving..." : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editRole} onOpenChange={(open) => !open && setEditRole(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit role</DialogTitle>
          </DialogHeader>
          <form onSubmit={editForm.handleSubmit(handleUpdate)}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-role-name">Name</Label>
                <Input
                  id="edit-role-name"
                  {...editForm.register("name")}
                  placeholder="e.g. Sales Rep"
                />
                {editForm.formState.errors.name && (
                  <p className="text-sm text-destructive">
                    {editForm.formState.errors.name.message}
                  </p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-role-level">Level (1 = lowest)</Label>
                <Input
                  id="edit-role-level"
                  type="number"
                  min={1}
                  {...editForm.register("level", { valueAsNumber: true })}
                />
                {editForm.formState.errors.level && (
                  <p className="text-sm text-destructive">
                    {editForm.formState.errors.level.message}
                  </p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-role-desc">Description (optional)</Label>
                <Input
                  id="edit-role-desc"
                  {...editForm.register("description")}
                  placeholder="Brief description"
                />
                {editForm.formState.errors.description && (
                  <p className="text-sm text-destructive">
                    {editForm.formState.errors.description.message}
                  </p>
                )}
              </div>
              <div className="grid gap-2">
                <Label>Permissions</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 border border-gray-100 rounded-sm">
                  {allPermissions.map((p) => (
                    <label
                      key={p}
                      className="flex items-center gap-2 text-sm cursor-pointer"
                    >
                      <Checkbox
                        checked={editPermissions.includes(p)}
                        onCheckedChange={(checked) => {
                          const current = editForm.getValues("permissions") || [];
                          editForm.setValue(
                            "permissions",
                            checked ? [...current, p] : current.filter((x) => x !== p)
                          );
                        }}
                      />
                      <span className="text-gray-700">{formatPermissionLabel(p)}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditRole(null)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={editForm.formState.isSubmitting || saving}
              >
                {saving ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteRole} onOpenChange={(open) => !open && setDeleteRole(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete role?</AlertDialogTitle>
            <AlertDialogDescription>
              This will deactivate &quot;{deleteRole?.name}&quot;. You can reactivate it later by
              editing. People with this role will need to be reassigned before deactivation takes
              effect in some flows.
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
