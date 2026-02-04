"use client";

import React, { useState, useEffect } from "react";
import { MapPin, Edit2, Trash2 } from "lucide-react";
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
import type { Office, PersonListItem } from "@/hooks/use-settings-data";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  officeFormSchema,
  officeCreateFormSchema,
  type OfficeFormData,
  type OfficeCreateFormData
} from "@/lib/validation/office-form";
import {
  SettingsSection,
  SettingsListItem,
  SettingsEmptyState,
  SettingsListSkeleton,
  SettingsAddButton,
} from "@/components/settings/shared";

interface LeadershipAssignment {
  id: string;
  roleType: string;
  personId: string;
  personFirstName: string;
  personLastName: string;
  effectiveFrom: string | null;
  effectiveTo: string | null;
}

interface OfficeLeadershipData {
  office: { id: string; name: string; region: string | null; division: string | null };
  ad: LeadershipAssignment[];
  regional: LeadershipAssignment[];
  divisional: LeadershipAssignment[];
  vp: LeadershipAssignment[];
}

interface SettingsOfficesSectionProps {
  offices: Office[];
  people: PersonListItem[];
  loading: boolean;
  onRefetch: () => void;
}

export function SettingsOfficesSection({
  offices,
  people,
  loading,
  onRefetch,
}: SettingsOfficesSectionProps) {
  const [addOpen, setAddOpen] = useState(false);
  const [editOffice, setEditOffice] = useState<Office | null>(null);
  const [deleteOffice, setDeleteOffice] = useState<Office | null>(null);
  const [saving, setSaving] = useState(false);
  const [leadershipData, setLeadershipData] = useState<OfficeLeadershipData | null>(null);

  const addForm = useForm<OfficeCreateFormData>({
    resolver: zodResolver(officeCreateFormSchema),
    defaultValues: {
      name: "",
      region: "",
      division: "",
      address: "",
      adPersonId: "",
      adEffectiveFrom: new Date().toISOString().slice(0, 10),
    },
  });

  const editForm = useForm<OfficeFormData>({
    resolver: zodResolver(officeFormSchema),
    defaultValues: {
      name: "",
      region: "",
      division: "",
      address: "",
    },
  });

  const adPersonId = addForm.watch("adPersonId");

  const openAdd = () => {
    addForm.reset({
      name: "",
      region: "",
      division: "",
      address: "",
      adPersonId: "",
      adEffectiveFrom: new Date().toISOString().slice(0, 10),
    });
    setAddOpen(true);
  };

  const openEdit = (office: Office) => {
    setEditOffice(office);
    editForm.reset({
      name: office.name,
      region: office.region ?? "",
      division: office.division ?? "",
      address: office.address ?? "",
    });
    setLeadershipData(null);
  };

  useEffect(() => {
    if (!editOffice?.id) return;
    let cancelled = false;
    fetch(`/api/offices/${editOffice.id}/leadership`)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("Failed to load"))))
      .then((data: OfficeLeadershipData) => {
        if (!cancelled) setLeadershipData(data);
      })
      .catch(() => {
        if (!cancelled) setLeadershipData(null);
      });
    return () => {
      cancelled = true;
    };
  }, [editOffice?.id]);

  async function handleCreate(data: OfficeCreateFormData) {
    setSaving(true);
    try {
      const officeRes = await fetch("/api/offices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name.trim(),
          region: data.region?.trim() || undefined,
          division: data.division?.trim() || undefined,
          address: data.address?.trim() || undefined,
        }),
      });
      if (!officeRes.ok) {
        const err = await officeRes.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error || "Failed to create office");
      }
      const newOffice = (await officeRes.json()) as Office;
      const leadershipRes = await fetch("/api/office-leadership", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          officeId: newOffice.id,
          roleType: "ad",
          personId: data.adPersonId,
          effectiveFrom: data.adEffectiveFrom,
        }),
      });
      if (!leadershipRes.ok) {
        const err = await leadershipRes.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error || "Failed to assign AD");
      }
      setAddOpen(false);
      addForm.reset();
      onRefetch();
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Error",
        description: e instanceof Error ? e.message : "Failed to create office",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdate(data: OfficeFormData) {
    if (!editOffice) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/offices/${editOffice.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name.trim(),
          region: data.region?.trim() || null,
          division: data.division?.trim() || null,
          address: data.address?.trim() || null,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error || "Failed to update");
      }
      setEditOffice(null);
      editForm.reset();
      onRefetch();
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Error",
        description: e instanceof Error ? e.message : "Failed to update office",
      });
    } finally {
      setSaving(false);
    }
  }

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
      toast({
        variant: "destructive",
        title: "Error",
        description: e instanceof Error ? e.message : "Failed to delete office",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <SettingsSection
      icon={MapPin}
      title="Offices"
      description="Manage office locations and leadership"
      action={<SettingsAddButton onClick={openAdd} />}
    >
      <div className="space-y-3">
        {loading ? (
          <SettingsListSkeleton count={3} />
        ) : offices.length === 0 ? (
          <SettingsEmptyState
            icon={MapPin}
            title="No offices yet"
            description="Add your first office to get started"
            action={{ label: "Add Office", onClick: openAdd }}
          />
        ) : (
          offices.map((office) => (
            <SettingsListItem
              key={office.id}
              title={office.name}
              subtitle={[office.region, office.division].filter(Boolean).join(" · ") || "—"}
              actions={
                <>
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
                </>
              }
            />
          ))
        )}
      </div>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add office</DialogTitle>
          </DialogHeader>
          <form onSubmit={addForm.handleSubmit(handleCreate)}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="add-office-name">Name</Label>
                <Input
                  id="add-office-name"
                  {...addForm.register("name")}
                  placeholder="e.g. Phoenix HQ"
                />
                {addForm.formState.errors.name && (
                  <p className="text-sm text-destructive">
                    {addForm.formState.errors.name.message}
                  </p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="add-office-region">Region (optional)</Label>
                <Input
                  id="add-office-region"
                  {...addForm.register("region")}
                  placeholder="e.g. West"
                />
                {addForm.formState.errors.region && (
                  <p className="text-sm text-destructive">
                    {addForm.formState.errors.region.message}
                  </p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="add-office-division">Division (optional)</Label>
                <Input
                  id="add-office-division"
                  {...addForm.register("division")}
                  placeholder="e.g. Central"
                />
                {addForm.formState.errors.division && (
                  <p className="text-sm text-destructive">
                    {addForm.formState.errors.division.message}
                  </p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="add-office-address">Address (optional)</Label>
                <Input
                  id="add-office-address"
                  {...addForm.register("address")}
                  placeholder="Street, city, state"
                />
                {addForm.formState.errors.address && (
                  <p className="text-sm text-destructive">
                    {addForm.formState.errors.address.message}
                  </p>
                )}
              </div>
              <div className="border-t pt-4 mt-2">
                <p className="text-sm font-medium text-gray-700 mb-2">Office leadership — AD (required)</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="add-ad-person">Area Director</Label>
                    <Select
                      value={adPersonId}
                      onValueChange={(v) => addForm.setValue("adPersonId", v)}
                    >
                      <SelectTrigger id="add-ad-person">
                        <SelectValue placeholder="Select person" />
                      </SelectTrigger>
                      <SelectContent>
                        {people.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.firstName} {p.lastName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {addForm.formState.errors.adPersonId && (
                      <p className="text-sm text-destructive">
                        {addForm.formState.errors.adPersonId.message}
                      </p>
                    )}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="add-ad-effective">Effective from</Label>
                    <Input
                      id="add-ad-effective"
                      type="date"
                      {...addForm.register("adEffectiveFrom")}
                    />
                    {addForm.formState.errors.adEffectiveFrom && (
                      <p className="text-sm text-destructive">
                        {addForm.formState.errors.adEffectiveFrom.message}
                      </p>
                    )}
                  </div>
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

      <Dialog open={!!editOffice} onOpenChange={(open) => !open && setEditOffice(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit office</DialogTitle>
          </DialogHeader>
          <form onSubmit={editForm.handleSubmit(handleUpdate)}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-office-name">Name</Label>
                <Input
                  id="edit-office-name"
                  {...editForm.register("name")}
                  placeholder="e.g. Phoenix HQ"
                />
                {editForm.formState.errors.name && (
                  <p className="text-sm text-destructive">
                    {editForm.formState.errors.name.message}
                  </p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-office-region">Region (optional)</Label>
                <Input
                  id="edit-office-region"
                  {...editForm.register("region")}
                  placeholder="e.g. West"
                />
                {editForm.formState.errors.region && (
                  <p className="text-sm text-destructive">
                    {editForm.formState.errors.region.message}
                  </p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-office-division">Division (optional)</Label>
                <Input
                  id="edit-office-division"
                  {...editForm.register("division")}
                  placeholder="e.g. Central"
                />
                {editForm.formState.errors.division && (
                  <p className="text-sm text-destructive">
                    {editForm.formState.errors.division.message}
                  </p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-office-address">Address (optional)</Label>
                <Input
                  id="edit-office-address"
                  {...editForm.register("address")}
                  placeholder="Street, city, state"
                />
                {editForm.formState.errors.address && (
                  <p className="text-sm text-destructive">
                    {editForm.formState.errors.address.message}
                  </p>
                )}
              </div>
              {leadershipData && (
                <div className="border-t pt-4 mt-2">
                  <p className="text-sm font-medium text-gray-700 mb-2">Office leadership</p>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {leadershipData.ad[0] && (
                      <li>
                        AD: {leadershipData.ad[0].personFirstName} {leadershipData.ad[0].personLastName}
                        {leadershipData.ad[0].effectiveFrom && ` (from ${leadershipData.ad[0].effectiveFrom})`}
                      </li>
                    )}
                    {leadershipData.regional[0] && (
                      <li>
                        Regional: {leadershipData.regional[0].personFirstName} {leadershipData.regional[0].personLastName}
                      </li>
                    )}
                    {leadershipData.divisional[0] && (
                      <li>
                        Divisional: {leadershipData.divisional[0].personFirstName} {leadershipData.divisional[0].personLastName}
                      </li>
                    )}
                    {leadershipData.vp[0] && (
                      <li>
                        VP: {leadershipData.vp[0].personFirstName} {leadershipData.vp[0].personLastName}
                      </li>
                    )}
                    {!leadershipData.ad[0] && (
                      <li className="text-amber-600">No AD assigned — assign in Users or via API.</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditOffice(null)}>
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
    </SettingsSection>
  );
}
