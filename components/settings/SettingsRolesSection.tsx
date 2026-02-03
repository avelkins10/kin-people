"use client";

import React, { useState } from "react";
import { Shield, Plus, Edit2, Trash2 } from "lucide-react";
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
import type { Role } from "@/hooks/use-settings-data";
import { Permission } from "@/lib/permissions/types";
import { getRolePermissions } from "@/lib/permissions/roles";

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
  const [formName, setFormName] = useState("");
  const [formLevel, setFormLevel] = useState(1);
  const [formDescription, setFormDescription] = useState("");
  const [formPermissions, setFormPermissions] = useState<string[]>([]);

  const allPermissions = Object.values(Permission) as string[];
  const formatPermissionLabel = (p: string) =>
    p.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

  const resetForm = () => {
    setFormName("");
    setFormLevel(1);
    setFormDescription("");
    setFormPermissions([]);
    setEditRole(null);
  };

  const openAdd = () => {
    resetForm();
    setFormPermissions([]);
    setAddOpen(true);
  };

  const openEdit = (role: Role) => {
    setEditRole(role);
    setFormName(role.name);
    setFormLevel(role.level);
    setFormDescription(role.description ?? "");
    setFormPermissions(
      Array.isArray(role.permissions) && role.permissions.length > 0
        ? (role.permissions as string[])
        : getRolePermissions(role.name)
    );
  };

  const handleCreate = async () => {
    if (!formName.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName.trim(),
          level: formLevel,
          description: formDescription.trim() || undefined,
          permissions: formPermissions.length > 0 ? formPermissions : undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error || "Failed to create");
      }
      setAddOpen(false);
      resetForm();
      onRefetch();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to create role");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!editRole || !formName.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/roles/${editRole.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName.trim(),
          level: formLevel,
          description: formDescription.trim() || null,
          permissions: formPermissions,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error || "Failed to update");
      }
      setEditRole(null);
      resetForm();
      onRefetch();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to update role");
    } finally {
      setSaving(false);
    }
  };

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
      alert(e instanceof Error ? e.message : "Failed to delete role");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white border border-gray-100 rounded-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-indigo-600" />
          <h3 className="text-lg font-extrabold uppercase tracking-tight text-black">
            Roles
          </h3>
        </div>
        <Button variant="ghost" size="icon" onClick={openAdd} aria-label="Add role">
          <Plus className="w-4 h-4 text-gray-500" />
        </Button>
      </div>
      <div className="space-y-3">
        {loading ? (
          <p className="text-sm text-gray-500">Loading...</p>
        ) : roles.length === 0 ? (
          <p className="text-sm text-gray-500">No roles yet. Add one to get started.</p>
        ) : (
          roles.map((role) => (
            <div
              key={role.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-sm group"
            >
              <div>
                <span className="font-bold text-sm text-gray-700 block">{role.name}</span>
                <span className="text-[10px] font-bold uppercase text-gray-400">
                  Level {role.level}
                  {role.description ? ` · ${role.description}` : ""}
                </span>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
              </div>
            </div>
          ))
        )}
      </div>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add role</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="add-role-name">Name</Label>
              <Input
                id="add-role-name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g. Sales Rep"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="add-role-level">Level (1 = lowest)</Label>
              <Input
                id="add-role-level"
                type="number"
                min={1}
                value={formLevel}
                onChange={(e) => setFormLevel(parseInt(e.target.value, 10) || 1)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="add-role-desc">Description (optional)</Label>
              <Input
                id="add-role-desc"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Brief description"
              />
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
                      checked={formPermissions.includes(p)}
                      onCheckedChange={(checked) => {
                        setFormPermissions((prev) =>
                          checked ? [...prev, p] : prev.filter((x) => x !== p)
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
            <Button variant="outline" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={saving || !formName.trim()}>
              {saving ? "Saving..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editRole} onOpenChange={(open) => !open && setEditRole(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit role</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-role-name">Name</Label>
              <Input
                id="edit-role-name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g. Sales Rep"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-role-level">Level (1 = lowest)</Label>
              <Input
                id="edit-role-level"
                type="number"
                min={1}
                value={formLevel}
                onChange={(e) => setFormLevel(parseInt(e.target.value, 10) || 1)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-role-desc">Description (optional)</Label>
              <Input
                id="edit-role-desc"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Brief description"
              />
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
                      checked={formPermissions.includes(p)}
                      onCheckedChange={(checked) => {
                        setFormPermissions((prev) =>
                          checked ? [...prev, p] : prev.filter((x) => x !== p)
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
            <Button variant="outline" onClick={() => setEditRole(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={saving || !formName.trim()}>
              {saving ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
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
    </div>
  );
}
