"use client";

import React, { useState, useEffect } from "react";
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
import type { Office, PersonListItem } from "@/hooks/use-settings-data";

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
  const [formName, setFormName] = useState("");
  const [formRegion, setFormRegion] = useState("");
  const [formDivision, setFormDivision] = useState("");
  const [formAddress, setFormAddress] = useState("");
  const [formAdPersonId, setFormAdPersonId] = useState("");
  const [formAdEffectiveFrom, setFormAdEffectiveFrom] = useState(
    () => new Date().toISOString().slice(0, 10)
  );
  const [leadershipData, setLeadershipData] = useState<OfficeLeadershipData | null>(null);

  const resetForm = () => {
    setFormName("");
    setFormRegion("");
    setFormDivision("");
    setFormAddress("");
    setFormAdPersonId("");
    setFormAdEffectiveFrom(new Date().toISOString().slice(0, 10));
    setEditOffice(null);
    setLeadershipData(null);
  };

  const openAdd = () => {
    resetForm();
    setAddOpen(true);
  };

  const openEdit = (office: Office) => {
    setEditOffice(office);
    setFormName(office.name);
    setFormRegion(office.region ?? "");
    setFormDivision(office.division ?? "");
    setFormAddress(office.address ?? "");
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

  const handleCreate = async () => {
    if (!formName.trim() || !formAdPersonId || !formAdEffectiveFrom) return;
    setSaving(true);
    try {
      const officeRes = await fetch("/api/offices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName.trim(),
          region: formRegion.trim() || undefined,
          division: formDivision.trim() || undefined,
          address: formAddress.trim() || undefined,
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
          personId: formAdPersonId,
          effectiveFrom: formAdEffectiveFrom,
        }),
      });
      if (!leadershipRes.ok) {
        const err = await leadershipRes.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error || "Failed to assign AD");
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
          division: formDivision.trim() || null,
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
      <div className="flex items-center justify-between mb-4">
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
                  {[office.region, office.division].filter(Boolean).join(" · ") || "—"}
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
              <Label htmlFor="add-office-division">Division (optional)</Label>
              <Input
                id="add-office-division"
                value={formDivision}
                onChange={(e) => setFormDivision(e.target.value)}
                placeholder="e.g. Central"
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
            <div className="border-t pt-4 mt-2">
              <p className="text-sm font-medium text-gray-700 mb-2">Office leadership — AD (required)</p>
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="add-ad-person">Area Director</Label>
                  <Select value={formAdPersonId} onValueChange={setFormAdPersonId}>
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
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="add-ad-effective">Effective from</Label>
                  <Input
                    id="add-ad-effective"
                    type="date"
                    value={formAdEffectiveFrom}
                    onChange={(e) => setFormAdEffectiveFrom(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={saving || !formName.trim() || !formAdPersonId || !formAdEffectiveFrom}
            >
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
              <Label htmlFor="edit-office-division">Division (optional)</Label>
              <Input
                id="edit-office-division"
                value={formDivision}
                onChange={(e) => setFormDivision(e.target.value)}
                placeholder="e.g. Central"
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
