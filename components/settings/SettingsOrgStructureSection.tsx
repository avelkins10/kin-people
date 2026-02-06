"use client";

import React, { useState, useMemo } from "react";
import { Network, Building2, Globe, MapPin, Users, Edit2, Trash2, UserCheck } from "lucide-react";
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
import type { Division, Region, Office, Team, LeadershipAssignment, PersonListItem, Role } from "@/hooks/use-settings-data";
import {
  SettingsSection,
  SettingsListItem,
  SettingsEmptyState,
  SettingsListSkeleton,
  SettingsAddButton,
} from "@/components/settings/shared";

interface SettingsOrgStructureSectionProps {
  divisions: Division[];
  regions: Region[];
  offices: Office[];
  teams: Team[];
  leadership: LeadershipAssignment[];
  people: PersonListItem[];
  roles: Role[];
  loading: boolean;
  onRefetch: () => void;
}

// ─── Leader Badge ────────────────────────────────────────────────────
function LeaderBadge({
  label,
  leaderName,
  onAssign,
}: {
  label: string;
  leaderName: string | null;
  onAssign: () => void;
}) {
  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); onAssign(); }}
      className="inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full border transition-colors hover:bg-indigo-50 hover:border-indigo-200"
    >
      <UserCheck className="w-3 h-3 text-indigo-500" />
      <span className="text-gray-500">{label}:</span>
      <span className={leaderName ? "text-gray-900 font-medium" : "text-gray-400 italic"}>
        {leaderName || "Unassigned"}
      </span>
    </button>
  );
}

// ─── Assign Leader Dialog ────────────────────────────────────────────
interface AssignLeaderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  people: PersonListItem[];
  roleLevelMap: Map<string, number>;
  minRoleLevel: number;
  currentAssignment: LeadershipAssignment | null;
  onSave: (personId: string, effectiveFrom: string) => Promise<void>;
}

function AssignLeaderDialog({
  open,
  onOpenChange,
  title,
  people,
  roleLevelMap,
  minRoleLevel,
  currentAssignment,
  onSave,
}: AssignLeaderDialogProps) {
  const [personId, setPersonId] = useState("");
  const [effectiveFrom, setEffectiveFrom] = useState(() => new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);

  const activePeople = useMemo(
    () => people
      .filter((p) => (p.status === "active" || p.status === "onboarding") && (roleLevelMap.get(p.roleName) ?? 0) >= minRoleLevel)
      .sort((a, b) => a.name.localeCompare(b.name)),
    [people, roleLevelMap, minRoleLevel]
  );

  const handleOpen = (isOpen: boolean) => {
    if (isOpen) {
      setPersonId("");
      setEffectiveFrom(new Date().toISOString().slice(0, 10));
    }
    onOpenChange(isOpen);
  };

  const handleSave = async () => {
    if (!personId) return;
    setSaving(true);
    try {
      await onSave(personId, effectiveFrom);
      onOpenChange(false);
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: e instanceof Error ? e.message : "Failed to assign leader" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent>
        <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
        <div className="grid gap-4 py-4">
          {currentAssignment && (
            <div className="text-sm text-gray-500 bg-gray-50 rounded-md p-3">
              Current: <span className="font-medium text-gray-900">{currentAssignment.personName}</span>
              <span className="ml-1">(since {currentAssignment.effectiveFrom})</span>
            </div>
          )}
          <div className="grid gap-2">
            <Label>Person</Label>
            <Select value={personId || "none"} onValueChange={(v) => setPersonId(v === "none" ? "" : v)}>
              <SelectTrigger><SelectValue placeholder="Select person" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Select a person</SelectItem>
                {activePeople.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="effective-from">Effective from</Label>
            <Input
              id="effective-from"
              type="date"
              value={effectiveFrom}
              onChange={(e) => setEffectiveFrom(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving || !personId}>
            {saving ? "Saving..." : currentAssignment ? "Change Leader" : "Assign Leader"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Leadership transition helper ────────────────────────────────────
async function transitionLeadership(
  currentAssignment: LeadershipAssignment | null,
  newPersonId: string,
  effectiveFrom: string,
  roleType: string,
  entityFields: Record<string, string>,
) {
  // Step 1: End the current assignment (effectiveTo = day before new effectiveFrom)
  if (currentAssignment) {
    const endDate = new Date(effectiveFrom);
    endDate.setDate(endDate.getDate() - 1);
    const effectiveTo = endDate.toISOString().slice(0, 10);

    const patchRes = await fetch(`/api/office-leadership/${currentAssignment.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ effectiveTo }),
    });
    if (!patchRes.ok) {
      const err = await patchRes.json().catch(() => ({}));
      throw new Error((err as { error?: string }).error || "Failed to end current assignment");
    }
  }

  // Step 2: Create the new assignment
  const postRes = await fetch("/api/office-leadership", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...entityFields,
      roleType,
      personId: newPersonId,
      effectiveFrom,
    }),
  });
  if (!postRes.ok) {
    const err = await postRes.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error || "Failed to create assignment");
  }
}

// ─── Divisions ────────────────────────────────────────────────────────
function DivisionsSection({
  divisions,
  loading,
  onRefetch,
}: {
  divisions: Division[];
  loading: boolean;
  onRefetch: () => void;
}) {
  const [addOpen, setAddOpen] = useState(false);
  const [editItem, setEditItem] = useState<Division | null>(null);
  const [deleteItem, setDeleteItem] = useState<Division | null>(null);
  const [saving, setSaving] = useState(false);
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");

  const resetForm = () => { setFormName(""); setFormDescription(""); };

  const openAdd = () => { resetForm(); setAddOpen(true); };
  const openEdit = (d: Division) => {
    setEditItem(d);
    setFormName(d.name);
    setFormDescription(d.description ?? "");
  };

  const handleCreate = async () => {
    if (!formName.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/divisions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: formName.trim(), description: formDescription.trim() || undefined }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error || "Failed to create");
      }
      setAddOpen(false);
      resetForm();
      onRefetch();
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: e instanceof Error ? e.message : "Failed to create division" });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!editItem || !formName.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/divisions/${editItem.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: formName.trim(), description: formDescription.trim() || null }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error || "Failed to update");
      }
      setEditItem(null);
      resetForm();
      onRefetch();
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: e instanceof Error ? e.message : "Failed to update division" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/divisions/${deleteItem.id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error || "Failed to delete");
      }
      setDeleteItem(null);
      onRefetch();
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: e instanceof Error ? e.message : "Failed to delete division" });
    } finally {
      setSaving(false);
    }
  };

  const active = divisions.filter((d) => d.isActive !== false);

  return (
    <SettingsSection
      icon={Building2}
      title="Divisions"
      description="Top-level organizational groupings"
      action={<SettingsAddButton onClick={openAdd} />}
    >
      <div className="space-y-3">
        {loading ? (
          <SettingsListSkeleton count={2} />
        ) : active.length === 0 ? (
          <SettingsEmptyState
            icon={Building2}
            title="No divisions yet"
            description="Add your first division to get started"
            action={{ label: "Add Division", onClick: openAdd }}
          />
        ) : (
          active.map((d) => (
            <SettingsListItem
              key={d.id}
              title={d.name}
              subtitle={d.description || "—"}
              actions={
                <>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(d)}>
                    <Edit2 className="w-3 h-3 text-indigo-600" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDeleteItem(d)}>
                    <Trash2 className="w-3 h-3 text-red-600" />
                  </Button>
                </>
              }
            />
          ))
        )}
      </div>

      {/* Add Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add division</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="add-div-name">Name</Label>
              <Input id="add-div-name" value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="e.g. West Division" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="add-div-desc">Description (optional)</Label>
              <Input id="add-div-desc" value={formDescription} onChange={(e) => setFormDescription(e.target.value)} placeholder="Brief description" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={saving || !formName.trim()}>{saving ? "Saving..." : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editItem} onOpenChange={(open) => !open && setEditItem(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit division</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-div-name">Name</Label>
              <Input id="edit-div-name" value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="e.g. West Division" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-div-desc">Description (optional)</Label>
              <Input id="edit-div-desc" value={formDescription} onChange={(e) => setFormDescription(e.target.value)} placeholder="Brief description" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditItem(null)}>Cancel</Button>
            <Button onClick={handleUpdate} disabled={saving || !formName.trim()}>{saving ? "Saving..." : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteItem} onOpenChange={(open) => !open && setDeleteItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate division?</AlertDialogTitle>
            <AlertDialogDescription>
              &quot;{deleteItem?.name}&quot; will be marked inactive.
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

// ─── Regions ──────────────────────────────────────────────────────────
function RegionsSection({
  regions,
  divisions,
  leadership,
  people,
  roleLevelMap,
  loading,
  onRefetch,
}: {
  regions: Region[];
  divisions: Division[];
  leadership: LeadershipAssignment[];
  people: PersonListItem[];
  roleLevelMap: Map<string, number>;
  loading: boolean;
  onRefetch: () => void;
}) {
  const [addOpen, setAddOpen] = useState(false);
  const [editItem, setEditItem] = useState<Region | null>(null);
  const [deleteItem, setDeleteItem] = useState<Region | null>(null);
  const [assignRegion, setAssignRegion] = useState<Region | null>(null);
  const [saving, setSaving] = useState(false);
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formDivisionId, setFormDivisionId] = useState("");

  const activeDivisions = divisions.filter((d) => d.isActive !== false);
  const divisionMap = new Map(divisions.map((d) => [d.id, d.name]));

  // Map regionId → current regional assignment
  const regionalByRegionId = useMemo(() => {
    const map = new Map<string, LeadershipAssignment>();
    leadership.forEach((l) => {
      if (l.roleType === "regional" && l.regionId) {
        map.set(l.regionId, l);
      }
    });
    return map;
  }, [leadership]);

  const resetForm = () => { setFormName(""); setFormDescription(""); setFormDivisionId(""); };

  const openAdd = () => { resetForm(); setAddOpen(true); };
  const openEdit = (r: Region) => {
    setEditItem(r);
    setFormName(r.name);
    setFormDescription(r.description ?? "");
    setFormDivisionId(r.divisionId ?? "");
  };

  const handleCreate = async () => {
    if (!formName.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/regions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName.trim(),
          description: formDescription.trim() || undefined,
          divisionId: formDivisionId || null,
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
      toast({ variant: "destructive", title: "Error", description: e instanceof Error ? e.message : "Failed to create region" });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!editItem || !formName.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/regions/${editItem.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName.trim(),
          description: formDescription.trim() || null,
          divisionId: formDivisionId || null,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error || "Failed to update");
      }
      setEditItem(null);
      resetForm();
      onRefetch();
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: e instanceof Error ? e.message : "Failed to update region" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/regions/${deleteItem.id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error || "Failed to delete");
      }
      setDeleteItem(null);
      onRefetch();
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: e instanceof Error ? e.message : "Failed to delete region" });
    } finally {
      setSaving(false);
    }
  };

  const handleAssignRegional = async (personId: string, effectiveFrom: string) => {
    if (!assignRegion) return;
    const currentAssignment = regionalByRegionId.get(assignRegion.id) ?? null;
    await transitionLeadership(currentAssignment, personId, effectiveFrom, "regional", { regionId: assignRegion.id });
    toast({ title: "Regional Manager assigned" });
    onRefetch();
  };

  const active = regions.filter((r) => r.isActive !== false);

  return (
    <SettingsSection
      icon={Globe}
      title="Regions"
      description="Group offices by geographic region"
      action={<SettingsAddButton onClick={openAdd} />}
    >
      <div className="space-y-3">
        {loading ? (
          <SettingsListSkeleton count={2} />
        ) : active.length === 0 ? (
          <SettingsEmptyState
            icon={Globe}
            title="No regions yet"
            description="Add your first region to get started"
            action={{ label: "Add Region", onClick: openAdd }}
          />
        ) : (
          active.map((r) => {
            const currentRegional = regionalByRegionId.get(r.id);
            return (
              <SettingsListItem
                key={r.id}
                title={r.name}
                subtitle={r.divisionId ? divisionMap.get(r.divisionId) ?? "—" : "No division"}
                metadata={[
                  <LeaderBadge
                    key="regional"
                    label="Regional"
                    leaderName={currentRegional?.personName ?? null}
                    onAssign={() => setAssignRegion(r)}
                  />,
                ]}
                actions={
                  <>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(r)}>
                      <Edit2 className="w-3 h-3 text-indigo-600" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDeleteItem(r)}>
                      <Trash2 className="w-3 h-3 text-red-600" />
                    </Button>
                  </>
                }
              />
            );
          })
        )}
      </div>

      {/* Add Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add region</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="add-reg-name">Name</Label>
              <Input id="add-reg-name" value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="e.g. West Region" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="add-reg-desc">Description (optional)</Label>
              <Input id="add-reg-desc" value={formDescription} onChange={(e) => setFormDescription(e.target.value)} placeholder="Brief description" />
            </div>
            <div className="grid gap-2">
              <Label>Division (optional)</Label>
              <Select value={formDivisionId || "none"} onValueChange={(v) => setFormDivisionId(v === "none" ? "" : v)}>
                <SelectTrigger><SelectValue placeholder="Select division" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {activeDivisions.map((d) => (
                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={saving || !formName.trim()}>{saving ? "Saving..." : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editItem} onOpenChange={(open) => !open && setEditItem(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit region</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-reg-name">Name</Label>
              <Input id="edit-reg-name" value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="e.g. West Region" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-reg-desc">Description (optional)</Label>
              <Input id="edit-reg-desc" value={formDescription} onChange={(e) => setFormDescription(e.target.value)} placeholder="Brief description" />
            </div>
            <div className="grid gap-2">
              <Label>Division (optional)</Label>
              <Select value={formDivisionId || "none"} onValueChange={(v) => setFormDivisionId(v === "none" ? "" : v)}>
                <SelectTrigger><SelectValue placeholder="Select division" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {activeDivisions.map((d) => (
                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditItem(null)}>Cancel</Button>
            <Button onClick={handleUpdate} disabled={saving || !formName.trim()}>{saving ? "Saving..." : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteItem} onOpenChange={(open) => !open && setDeleteItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate region?</AlertDialogTitle>
            <AlertDialogDescription>
              &quot;{deleteItem?.name}&quot; will be marked inactive.
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

      {/* Assign Regional Dialog */}
      <AssignLeaderDialog
        open={!!assignRegion}
        onOpenChange={(open) => !open && setAssignRegion(null)}
        title={`Assign Regional Manager — ${assignRegion?.name ?? ""}`}
        people={people}
        roleLevelMap={roleLevelMap}
        minRoleLevel={4}
        currentAssignment={assignRegion ? regionalByRegionId.get(assignRegion.id) ?? null : null}
        onSave={handleAssignRegional}
      />
    </SettingsSection>
  );
}

// ─── Offices ──────────────────────────────────────────────────────────
function OfficesSection({
  offices,
  regions,
  leadership,
  people,
  roleLevelMap,
  loading,
  onRefetch,
}: {
  offices: Office[];
  regions: Region[];
  leadership: LeadershipAssignment[];
  people: PersonListItem[];
  roleLevelMap: Map<string, number>;
  loading: boolean;
  onRefetch: () => void;
}) {
  const [addOpen, setAddOpen] = useState(false);
  const [editItem, setEditItem] = useState<Office | null>(null);
  const [deleteItem, setDeleteItem] = useState<Office | null>(null);
  const [assignOffice, setAssignOffice] = useState<Office | null>(null);
  const [saving, setSaving] = useState(false);
  const [formName, setFormName] = useState("");
  const [formRegionId, setFormRegionId] = useState("");
  const [formDivision, setFormDivision] = useState("");
  const [formAddress, setFormAddress] = useState("");

  const activeRegions = regions.filter((r) => r.isActive !== false);
  const regionMap = new Map(regions.map((r) => [r.id, r.name]));

  // Map officeId → current AD assignment
  const adByOfficeId = useMemo(() => {
    const map = new Map<string, LeadershipAssignment>();
    leadership.forEach((l) => {
      if (l.roleType === "ad" && l.officeId) {
        map.set(l.officeId, l);
      }
    });
    return map;
  }, [leadership]);

  const resetForm = () => { setFormName(""); setFormRegionId(""); setFormDivision(""); setFormAddress(""); };

  const openAdd = () => { resetForm(); setAddOpen(true); };
  const openEdit = (o: Office) => {
    setEditItem(o);
    setFormName(o.name);
    setFormRegionId(o.regionId ?? "");
    setFormDivision(o.division ?? "");
    setFormAddress(o.address ?? "");
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
          regionId: formRegionId || null,
          division: formDivision.trim() || undefined,
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
      toast({ variant: "destructive", title: "Error", description: e instanceof Error ? e.message : "Failed to create office" });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!editItem || !formName.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/offices/${editItem.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName.trim(),
          regionId: formRegionId || null,
          division: formDivision.trim() || null,
          address: formAddress.trim() || null,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error || "Failed to update");
      }
      setEditItem(null);
      resetForm();
      onRefetch();
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: e instanceof Error ? e.message : "Failed to update office" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/offices/${deleteItem.id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error || "Failed to delete");
      }
      setDeleteItem(null);
      onRefetch();
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: e instanceof Error ? e.message : "Failed to delete office" });
    } finally {
      setSaving(false);
    }
  };

  const handleAssignAD = async (personId: string, effectiveFrom: string) => {
    if (!assignOffice) return;
    const currentAssignment = adByOfficeId.get(assignOffice.id) ?? null;
    await transitionLeadership(currentAssignment, personId, effectiveFrom, "ad", { officeId: assignOffice.id });
    toast({ title: "Area Director assigned" });
    onRefetch();
  };

  return (
    <SettingsSection
      icon={MapPin}
      title="Offices"
      description="Manage office locations and their region assignments"
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
          offices.map((o) => {
            const currentAD = adByOfficeId.get(o.id);
            return (
              <SettingsListItem
                key={o.id}
                title={o.name}
                subtitle={
                  [o.regionId ? regionMap.get(o.regionId) : o.region, o.division]
                    .filter(Boolean)
                    .join(" · ") || "—"
                }
                metadata={[
                  <LeaderBadge
                    key="ad"
                    label="AD"
                    leaderName={currentAD?.personName ?? null}
                    onAssign={() => setAssignOffice(o)}
                  />,
                ]}
                actions={
                  <>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(o)}>
                      <Edit2 className="w-3 h-3 text-indigo-600" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDeleteItem(o)}>
                      <Trash2 className="w-3 h-3 text-red-600" />
                    </Button>
                  </>
                }
              />
            );
          })
        )}
      </div>

      {/* Add Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add office</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="add-off-name">Name</Label>
              <Input id="add-off-name" value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="e.g. Phoenix HQ" />
            </div>
            <div className="grid gap-2">
              <Label>Region (optional)</Label>
              <Select value={formRegionId || "none"} onValueChange={(v) => setFormRegionId(v === "none" ? "" : v)}>
                <SelectTrigger><SelectValue placeholder="Select region" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {activeRegions.map((r) => (
                    <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="add-off-division">Division (optional)</Label>
              <Input id="add-off-division" value={formDivision} onChange={(e) => setFormDivision(e.target.value)} placeholder="e.g. Central" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="add-off-address">Address (optional)</Label>
              <Input id="add-off-address" value={formAddress} onChange={(e) => setFormAddress(e.target.value)} placeholder="Street, city, state" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={saving || !formName.trim()}>{saving ? "Saving..." : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editItem} onOpenChange={(open) => !open && setEditItem(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit office</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-off-name">Name</Label>
              <Input id="edit-off-name" value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="e.g. Phoenix HQ" />
            </div>
            <div className="grid gap-2">
              <Label>Region (optional)</Label>
              <Select value={formRegionId || "none"} onValueChange={(v) => setFormRegionId(v === "none" ? "" : v)}>
                <SelectTrigger><SelectValue placeholder="Select region" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {activeRegions.map((r) => (
                    <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-off-division">Division (optional)</Label>
              <Input id="edit-off-division" value={formDivision} onChange={(e) => setFormDivision(e.target.value)} placeholder="e.g. Central" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-off-address">Address (optional)</Label>
              <Input id="edit-off-address" value={formAddress} onChange={(e) => setFormAddress(e.target.value)} placeholder="Street, city, state" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditItem(null)}>Cancel</Button>
            <Button onClick={handleUpdate} disabled={saving || !formName.trim()}>{saving ? "Saving..." : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteItem} onOpenChange={(open) => !open && setDeleteItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate office?</AlertDialogTitle>
            <AlertDialogDescription>
              &quot;{deleteItem?.name}&quot; will be marked inactive.
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

      {/* Assign AD Dialog */}
      <AssignLeaderDialog
        open={!!assignOffice}
        onOpenChange={(open) => !open && setAssignOffice(null)}
        title={`Assign Area Director — ${assignOffice?.name ?? ""}`}
        people={people}
        roleLevelMap={roleLevelMap}
        minRoleLevel={3}
        currentAssignment={assignOffice ? adByOfficeId.get(assignOffice.id) ?? null : null}
        onSave={handleAssignAD}
      />
    </SettingsSection>
  );
}

// ─── Teams ────────────────────────────────────────────────────────────
function TeamsSection({
  teams,
  offices,
  people,
  roleLevelMap,
  loading,
  onRefetch,
}: {
  teams: Team[];
  offices: Office[];
  people: PersonListItem[];
  roleLevelMap: Map<string, number>;
  loading: boolean;
  onRefetch: () => void;
}) {
  const [addOpen, setAddOpen] = useState(false);
  const [editItem, setEditItem] = useState<Team | null>(null);
  const [deleteItem, setDeleteItem] = useState<Team | null>(null);
  const [assignTeam, setAssignTeam] = useState<Team | null>(null);
  const [saving, setSaving] = useState(false);
  const [formName, setFormName] = useState("");
  const [formOfficeId, setFormOfficeId] = useState("");
  const [formDescription, setFormDescription] = useState("");

  const officeMap = new Map(offices.map((o) => [o.id, o.name]));

  // Map teamLeadId → person name for display
  const personMap = useMemo(() => {
    const map = new Map<string, string>();
    people.forEach((p) => map.set(p.id, p.name));
    return map;
  }, [people]);

  const resetForm = () => { setFormName(""); setFormOfficeId(""); setFormDescription(""); };

  const openAdd = () => { resetForm(); setAddOpen(true); };
  const openEdit = (t: Team) => {
    setEditItem(t);
    setFormName(t.name);
    setFormOfficeId(t.officeId ?? "");
    setFormDescription(t.description ?? "");
  };

  const handleCreate = async () => {
    if (!formName.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName.trim(),
          officeId: formOfficeId || undefined,
          description: formDescription.trim() || undefined,
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
      toast({ variant: "destructive", title: "Error", description: e instanceof Error ? e.message : "Failed to create team" });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!editItem || !formName.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/teams/${editItem.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName.trim(),
          officeId: formOfficeId || null,
          description: formDescription.trim() || null,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error || "Failed to update");
      }
      setEditItem(null);
      resetForm();
      onRefetch();
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: e instanceof Error ? e.message : "Failed to update team" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/teams/${deleteItem.id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error || "Failed to delete");
      }
      setDeleteItem(null);
      onRefetch();
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: e instanceof Error ? e.message : "Failed to delete team" });
    } finally {
      setSaving(false);
    }
  };

  const handleAssignTeamLead = async (personId: string) => {
    if (!assignTeam) return;
    const res = await fetch(`/api/teams/${assignTeam.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teamLeadId: personId }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error((err as { error?: string }).error || "Failed to assign team lead");
    }
    toast({ title: "Team Lead assigned" });
    onRefetch();
  };

  const activePeople = useMemo(
    () => people
      .filter((p) => (p.status === "active" || p.status === "onboarding") && (roleLevelMap.get(p.roleName) ?? 0) >= 2)
      .sort((a, b) => a.name.localeCompare(b.name)),
    [people, roleLevelMap]
  );

  return (
    <SettingsSection
      icon={Users}
      title="Teams"
      description="Organize people into teams within offices"
      action={<SettingsAddButton onClick={openAdd} />}
    >
      <div className="space-y-3">
        {loading ? (
          <SettingsListSkeleton count={3} />
        ) : teams.length === 0 ? (
          <SettingsEmptyState
            icon={Users}
            title="No teams yet"
            description="Add your first team to get started"
            action={{ label: "Add Team", onClick: openAdd }}
          />
        ) : (
          teams.map((t) => {
            const leadName = t.teamLeadId ? personMap.get(t.teamLeadId) ?? null : null;
            return (
              <SettingsListItem
                key={t.id}
                title={t.name}
                subtitle={t.officeId ? officeMap.get(t.officeId) ?? t.officeName ?? "—" : "No office"}
                metadata={[
                  <LeaderBadge
                    key="lead"
                    label="Lead"
                    leaderName={leadName}
                    onAssign={() => setAssignTeam(t)}
                  />,
                ]}
                actions={
                  <>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(t)}>
                      <Edit2 className="w-3 h-3 text-indigo-600" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDeleteItem(t)}>
                      <Trash2 className="w-3 h-3 text-red-600" />
                    </Button>
                  </>
                }
              />
            );
          })
        )}
      </div>

      {/* Add Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add team</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="add-team-name2">Name</Label>
              <Input id="add-team-name2" value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="e.g. West Sales" />
            </div>
            <div className="grid gap-2">
              <Label>Office (optional)</Label>
              <Select value={formOfficeId || "none"} onValueChange={(v) => setFormOfficeId(v === "none" ? "" : v)}>
                <SelectTrigger><SelectValue placeholder="Select office" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {offices.map((o) => (
                    <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="add-team-desc2">Description (optional)</Label>
              <Input id="add-team-desc2" value={formDescription} onChange={(e) => setFormDescription(e.target.value)} placeholder="Brief description" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={saving || !formName.trim()}>{saving ? "Saving..." : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editItem} onOpenChange={(open) => !open && setEditItem(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit team</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-team-name2">Name</Label>
              <Input id="edit-team-name2" value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="e.g. West Sales" />
            </div>
            <div className="grid gap-2">
              <Label>Office (optional)</Label>
              <Select value={formOfficeId || "none"} onValueChange={(v) => setFormOfficeId(v === "none" ? "" : v)}>
                <SelectTrigger><SelectValue placeholder="Select office" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {offices.map((o) => (
                    <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-team-desc2">Description (optional)</Label>
              <Input id="edit-team-desc2" value={formDescription} onChange={(e) => setFormDescription(e.target.value)} placeholder="Brief description" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditItem(null)}>Cancel</Button>
            <Button onClick={handleUpdate} disabled={saving || !formName.trim()}>{saving ? "Saving..." : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteItem} onOpenChange={(open) => !open && setDeleteItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate team?</AlertDialogTitle>
            <AlertDialogDescription>
              &quot;{deleteItem?.name}&quot; will be marked inactive.
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

      {/* Assign Team Lead Dialog — simpler since it uses teams.teamLeadId directly */}
      <Dialog open={!!assignTeam} onOpenChange={(open) => !open && setAssignTeam(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Team Lead — {assignTeam?.name ?? ""}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {assignTeam?.teamLeadId && (
              <div className="text-sm text-gray-500 bg-gray-50 rounded-md p-3">
                Current: <span className="font-medium text-gray-900">{personMap.get(assignTeam.teamLeadId) ?? "Unknown"}</span>
              </div>
            )}
            <div className="grid gap-2">
              <Label>Person</Label>
              <TeamLeadSelect
                people={activePeople}
                currentTeamLeadId={assignTeam?.teamLeadId ?? null}
                onSelect={async (personId) => {
                  await handleAssignTeamLead(personId);
                  setAssignTeam(null);
                }}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </SettingsSection>
  );
}

// Small helper component to avoid stale closure issues with team lead select
function TeamLeadSelect({
  people,
  currentTeamLeadId,
  onSelect,
}: {
  people: PersonListItem[];
  currentTeamLeadId: string | null;
  onSelect: (personId: string) => Promise<void>;
}) {
  const [personId, setPersonId] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!personId) return;
    setSaving(true);
    try {
      await onSelect(personId);
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: e instanceof Error ? e.message : "Failed to assign" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex gap-2 items-end">
      <div className="flex-1">
        <Select value={personId || "none"} onValueChange={(v) => setPersonId(v === "none" ? "" : v)}>
          <SelectTrigger><SelectValue placeholder="Select person" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Select a person</SelectItem>
            {people.map((p) => (
              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button onClick={handleSave} disabled={saving || !personId} size="sm">
        {saving ? "Saving..." : "Assign"}
      </Button>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────
export function SettingsOrgStructureSection({
  divisions,
  regions,
  offices,
  teams,
  leadership,
  people,
  roles,
  loading,
  onRefetch,
}: SettingsOrgStructureSectionProps) {
  // Build roleName → level lookup for filtering leadership candidates
  const roleLevelMap = useMemo(() => {
    const map = new Map<string, number>();
    roles.forEach((r) => map.set(r.name, r.level));
    return map;
  }, [roles]);

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <Network className="w-5 h-5 text-emerald-600" />
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Org Structure</h2>
          <p className="text-sm text-gray-500">Division &rarr; Region &rarr; Office &rarr; Team</p>
        </div>
      </div>

      <DivisionsSection divisions={divisions} loading={loading} onRefetch={onRefetch} />
      <RegionsSection regions={regions} divisions={divisions} leadership={leadership} people={people} roleLevelMap={roleLevelMap} loading={loading} onRefetch={onRefetch} />
      <OfficesSection offices={offices} regions={regions} leadership={leadership} people={people} roleLevelMap={roleLevelMap} loading={loading} onRefetch={onRefetch} />
      <TeamsSection teams={teams} offices={offices} people={people} roleLevelMap={roleLevelMap} loading={loading} onRefetch={onRefetch} />
    </div>
  );
}
