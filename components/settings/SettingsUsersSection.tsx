"use client";

import React, { useState } from "react";
import { UserPlus, Plus, Edit2, Shield } from "lucide-react";
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
import { toast } from "@/hooks/use-toast";
import type { PersonListItem, Role, Office } from "@/hooks/use-settings-data";
import { useSettingsData } from "@/hooks/use-settings-data";

interface SettingsUsersSectionProps {
  people: PersonListItem[];
  roles: Role[];
  offices: Office[];
  loading: boolean;
  onRefetch: () => void;
}

export function SettingsUsersSection({
  people,
  roles,
  offices,
  loading,
  onRefetch,
}: SettingsUsersSectionProps) {
  const [addOpen, setAddOpen] = useState(false);
  const [editPerson, setEditPerson] = useState<PersonListItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [formFirstName, setFormFirstName] = useState("");
  const [formLastName, setFormLastName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formRoleId, setFormRoleId] = useState("");
  const [formOfficeId, setFormOfficeId] = useState("");
  const [formAssignAdOfficeId, setFormAssignAdOfficeId] = useState("");
  const [formAssignAdEffectiveFrom, setFormAssignAdEffectiveFrom] = useState(
    () => new Date().toISOString().slice(0, 10)
  );

  const adminRoleId = roles.find((r) => r.name === "Admin")?.id;
  const areaDirectorRoleId = roles.find((r) => r.name === "Area Director")?.id ?? "";
  const isAreaDirectorRole = formRoleId === areaDirectorRoleId;

  const resetForm = () => {
    setFormFirstName("");
    setFormLastName("");
    setFormEmail("");
    setFormPhone("");
    setFormRoleId(roles[0]?.id ?? "");
    setFormOfficeId("");
    setFormAssignAdOfficeId("");
    setFormAssignAdEffectiveFrom(new Date().toISOString().slice(0, 10));
    setEditPerson(null);
  };

  const openAdd = () => {
    setFormRoleId(roles[0]?.id ?? "");
    setFormOfficeId("");
    setFormFirstName("");
    setFormLastName("");
    setFormEmail("");
    setFormPhone("");
    setAddOpen(true);
  };

  const openEdit = (person: PersonListItem) => {
    setEditPerson(person);
    setFormFirstName(person.firstName);
    setFormLastName(person.lastName);
    setFormEmail(person.email);
    setFormPhone("");
    setFormRoleId(roles.find((r) => r.name === person.roleName)?.id ?? "");
    setFormOfficeId(person.officeId ?? "");
    setFormAssignAdOfficeId("");
    setFormAssignAdEffectiveFrom(new Date().toISOString().slice(0, 10));
  };

  const handleCreate = async () => {
    if (!formFirstName.trim() || !formLastName.trim() || !formEmail.trim() || !formRoleId) return;
    setSaving(true);
    try {
      const res = await fetch("/api/people", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: formFirstName.trim(),
          lastName: formLastName.trim(),
          email: formEmail.trim(),
          phone: formPhone.trim() || undefined,
          roleId: formRoleId,
          officeId: formOfficeId || undefined,
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
      toast({
        variant: "destructive",
        title: "Error",
        description: e instanceof Error ? e.message : "Failed to create user",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!editPerson || !formFirstName.trim() || !formLastName.trim() || !formEmail.trim()) return;
    setSaving(true);
    try {
      const patchRes = await fetch(`/api/people/${editPerson.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: formFirstName.trim(),
          lastName: formLastName.trim(),
          email: formEmail.trim(),
          phone: formPhone.trim() || null,
        }),
      });
      if (!patchRes.ok) {
        const err = await patchRes.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error || "Failed to update");
      }

      const currentRoleId = roles.find((r) => r.name === editPerson.roleName)?.id ?? "";
      if (formRoleId !== currentRoleId) {
        const roleRes = await fetch(`/api/people/${editPerson.id}/change-role`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            newRoleId: formRoleId,
            effectiveDate: new Date().toISOString().slice(0, 10),
            reason: "Role changed from Settings",
          }),
        });
        if (!roleRes.ok) {
          const err = await roleRes.json().catch(() => ({}));
          throw new Error((err as { error?: string }).error || "Failed to update role");
        }
      }

      if (formOfficeId !== (editPerson.officeId ?? "")) {
        if (formOfficeId) {
          const officeRes = await fetch(`/api/people/${editPerson.id}/change-office`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              newOfficeId: formOfficeId,
              effectiveDate: new Date().toISOString().slice(0, 10),
              reason: "Office changed from Settings",
            }),
          });
          if (!officeRes.ok) {
            const err = await officeRes.json().catch(() => ({}));
            throw new Error((err as { error?: string }).error || "Failed to update office");
          }
        }
      }

      if (formRoleId === areaDirectorRoleId && formAssignAdOfficeId) {
        const adRes = await fetch("/api/office-leadership", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            officeId: formAssignAdOfficeId,
            roleType: "ad",
            personId: editPerson.id,
            effectiveFrom: formAssignAdEffectiveFrom,
          }),
        });
        if (!adRes.ok) {
          const err = await adRes.json().catch(() => ({}));
          throw new Error((err as { error?: string }).error || "Failed to assign AD");
        }
      }

      setEditPerson(null);
      resetForm();
      onRefetch();
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Error",
        description: e instanceof Error ? e.message : "Failed to update user",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleMakeAdmin = async (person: PersonListItem) => {
    if (!adminRoleId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Admin role not found",
      });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/people/${person.id}/change-role`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newRoleId: adminRoleId,
          effectiveDate: new Date().toISOString().slice(0, 10),
          reason: "Made admin from Settings",
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error || "Failed to update role");
      }
      onRefetch();
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Error",
        description: e instanceof Error ? e.message : "Failed to make admin",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white border border-gray-100 rounded-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <UserPlus className="w-5 h-5 text-indigo-600" />
          <h3 className="text-lg font-extrabold uppercase tracking-tight text-black">
            Users
          </h3>
        </div>
        <Button variant="ghost" size="icon" onClick={openAdd} aria-label="Add user">
          <Plus className="w-4 h-4 text-gray-500" />
        </Button>
      </div>
      <div className="space-y-3">
        {loading ? (
          <p className="text-sm text-gray-500">Loading...</p>
        ) : people.length === 0 ? (
          <p className="text-sm text-gray-500">No users yet. Add one to get started.</p>
        ) : (
          people.map((person) => (
            <div
              key={person.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-sm group"
            >
              <div>
                <span className="font-bold text-sm text-gray-700 block">{person.name}</span>
                <span className="text-[10px] font-bold uppercase text-gray-400">
                  {person.email} · {person.roleName}
                </span>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => openEdit(person)}
                  aria-label={`Edit ${person.name}`}
                >
                  <Edit2 className="w-3 h-3 text-indigo-600" />
                </Button>
                {adminRoleId && person.roleName !== "Admin" && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleMakeAdmin(person)}
                    disabled={saving}
                    aria-label={`Make ${person.name} admin`}
                    title="Make admin"
                  >
                    <Shield className="w-3 h-3 text-amber-600" />
                  </Button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add user</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="add-user-first">First name</Label>
                <Input
                  id="add-user-first"
                  value={formFirstName}
                  onChange={(e) => setFormFirstName(e.target.value)}
                  placeholder="Jane"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="add-user-last">Last name</Label>
                <Input
                  id="add-user-last"
                  value={formLastName}
                  onChange={(e) => setFormLastName(e.target.value)}
                  placeholder="Doe"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="add-user-email">Email</Label>
              <Input
                id="add-user-email"
                type="email"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                placeholder="jane@example.com"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="add-user-phone">Phone (optional)</Label>
              <Input
                id="add-user-phone"
                value={formPhone}
                onChange={(e) => setFormPhone(e.target.value)}
                placeholder="+1 234 567 8900"
              />
            </div>
            <div className="grid gap-2">
              <Label>Role</Label>
              <Select value={formRoleId} onValueChange={setFormRoleId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Office (optional)</Label>
              <Select value={formOfficeId || "none"} onValueChange={(v) => setFormOfficeId(v === "none" ? "" : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select office" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {offices.map((o) => (
                    <SelectItem key={o.id} value={o.id}>
                      {o.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={saving || !formFirstName.trim() || !formLastName.trim() || !formEmail.trim() || !formRoleId}
            >
              {saving ? "Saving..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editPerson} onOpenChange={(open) => !open && setEditPerson(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit user</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-user-first">First name</Label>
                <Input
                  id="edit-user-first"
                  value={formFirstName}
                  onChange={(e) => setFormFirstName(e.target.value)}
                  placeholder="Jane"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-user-last">Last name</Label>
                <Input
                  id="edit-user-last"
                  value={formLastName}
                  onChange={(e) => setFormLastName(e.target.value)}
                  placeholder="Doe"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-user-email">Email</Label>
              <Input
                id="edit-user-email"
                type="email"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                placeholder="jane@example.com"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-user-phone">Phone (optional)</Label>
              <Input
                id="edit-user-phone"
                value={formPhone}
                onChange={(e) => setFormPhone(e.target.value)}
                placeholder="+1 234 567 8900"
              />
            </div>
            <div className="grid gap-2">
              <Label>Role</Label>
              <Select value={formRoleId} onValueChange={setFormRoleId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Office (optional)</Label>
              <Select value={formOfficeId || "none"} onValueChange={(v) => setFormOfficeId(v === "none" ? "" : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select office" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {offices.map((o) => (
                    <SelectItem key={o.id} value={o.id}>
                      {o.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {isAreaDirectorRole && (
              <div className="border-t pt-4 mt-2 space-y-2">
                <p className="text-sm font-medium text-gray-700">Assign as AD to an office?</p>
                <p className="text-xs text-gray-500">
                  Overrides apply only from the effective date forward. Create an office in the Offices tab if needed.
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="edit-ad-office">Office</Label>
                    <Select value={formAssignAdOfficeId} onValueChange={setFormAssignAdOfficeId}>
                      <SelectTrigger id="edit-ad-office">
                        <SelectValue placeholder="Select office" />
                      </SelectTrigger>
                      <SelectContent>
                        {offices.map((o) => (
                          <SelectItem key={o.id} value={o.id}>
                            {o.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-ad-effective">Effective from</Label>
                    <Input
                      id="edit-ad-effective"
                      type="date"
                      value={formAssignAdEffectiveFrom}
                      onChange={(e) => setFormAssignAdEffectiveFrom(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditPerson(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={saving || !formFirstName.trim() || !formLastName.trim() || !formEmail.trim()}
            >
              {saving ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
