"use client";

import React, { useState } from "react";
import { MapPin, Plus, Edit2, Trash2 } from "lucide-react";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { Office } from "@/hooks/use-settings-data";

interface SettingsOfficesSectionProps {
  offices: Office[];
  loading: boolean;
  onRefetch: () => void;
}

export function SettingsOfficesSection({
  offices,
  loading,
  onRefetch,
}: SettingsOfficesSectionProps) {
  const [addOpen, setAddOpen] = useState(false);
  const [editOffice, setEditOffice] = useState<Office | null>(null);
  const [deleteOffice, setDeleteOffice] = useState<Office | null>(null);
  const [saving, setSaving] = useState(false);
  const [formName, setFormName] = useState("");
  const [formRegion, setFormRegion] = useState("");
  const [formAddress, setFormAddress] = useState("");

  const resetForm = () => {
    setFormName("");
    setFormRegion("");
    setFormAddress("");
    setEditOffice(null);
  };

  const openAdd = () => {
    resetForm();
    setAddOpen(true);
  };

  const openEdit = (office: Office) => {
    setEditOffice(office);
    setFormName(office.name);
    setFormRegion(office.region ?? "");
    setFormAddress(office.address ?? "");
  };

  const handleCreate = async () => {
    if (!formName.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/offices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName.trim(),
          region: formRegion.trim() || undefined,
          address: formAddress.trim() || undefined,
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
      alert(e instanceof Error ? e.message : "Failed to create office");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!editOffice || !formName.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/offices/${editOffice.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName.trim(),
          region: formRegion.trim() || null,
          address: formAddress.trim() || null,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error || "Failed to update");
      }
      setEditOffice(null);
      resetForm();
      onRefetch();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to update office");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteOffice) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/offices/${deleteOffice.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error || "Failed to delete");
      }
      setDeleteOffice(null);
      onRefetch();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to delete office");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white border border-gray-100 rounded-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-indigo-600" />
          <h3 className="text-lg font-extrabold uppercase tracking-tight text-black">
            Offices
          </h3>
        </div>
        <Button variant="ghost" size="icon" onClick={openAdd} aria-label="Add office">
          <Plus className="w-4 h-4 text-gray-500" />
        </Button>
      </div>
      <div className="space-y-3">
        {loading ? (
          <p className="text-sm text-gray-500">Loading...</p>
        ) : offices.length === 0 ? (
          <p className="text-sm text-gray-500">No offices yet. Add one to get started.</p>
        ) : (
          offices.map((office) => (
            <div
              key={office.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-sm group"
            >
              <div>
                <span className="font-bold text-sm text-gray-700 block">{office.name}</span>
                <span className="text-[10px] font-bold uppercase text-gray-400">
                  {office.region ?? "—"}
                </span>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => openEdit(office)}
                  aria-label={`Edit ${office.name}`}
                >
                  <Edit2 className="w-3 h-3 text-indigo-600" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setDeleteOffice(office)}
                  aria-label={`Delete ${office.name}`}
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
            <DialogTitle>Add office</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="add-office-name">Name</Label>
              <Input
                id="add-office-name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g. Phoenix HQ"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="add-office-region">Region (optional)</Label>
              <Input
                id="add-office-region"
                value={formRegion}
                onChange={(e) => setFormRegion(e.target.value)}
                placeholder="e.g. West"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="add-office-address">Address (optional)</Label>
              <Input
                id="add-office-address"
                value={formAddress}
                onChange={(e) => setFormAddress(e.target.value)}
                placeholder="Street, city, state"
              />
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

      <Dialog open={!!editOffice} onOpenChange={(open) => !open && setEditOffice(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit office</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-office-name">Name</Label>
              <Input
                id="edit-office-name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g. Phoenix HQ"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-office-region">Region (optional)</Label>
              <Input
                id="edit-office-region"
                value={formRegion}
                onChange={(e) => setFormRegion(e.target.value)}
                placeholder="e.g. West"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-office-address">Address (optional)</Label>
              <Input
                id="edit-office-address"
                value={formAddress}
                onChange={(e) => setFormAddress(e.target.value)}
                placeholder="Street, city, state"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOffice(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={saving || !formName.trim()}>
              {saving ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteOffice} onOpenChange={(open) => !open && setDeleteOffice(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate office?</AlertDialogTitle>
            <AlertDialogDescription>
              &quot;{deleteOffice?.name}&quot; will be marked inactive. You can reactivate it
              later by editing.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={saving} className="bg-red-600">
              {saving ? "Deactivating..." : "Deactivate"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
