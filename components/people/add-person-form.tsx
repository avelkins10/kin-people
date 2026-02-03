"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Role {
  id: string;
  name: string;
}

interface Office {
  id: string;
  name: string;
}

interface Manager {
  id: string;
  firstName: string;
  lastName: string;
}

export function AddPersonForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);
  const [offices, setOffices] = useState<Office[]>([]);
  const [managers, setManagers] = useState<Manager[]>([]);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    roleId: "",
    officeId: "",
    reportsToId: "",
    status: "active" as "onboarding" | "active" | "inactive",
    hireDate: "",
  });

  useEffect(() => {
    async function fetchOptions() {
      try {
        const [rolesRes, officesRes, managersRes] = await Promise.all([
          fetch("/api/roles?active=true"),
          fetch("/api/offices?active=true"),
          fetch("/api/people?roleLevel=manager"),
        ]);

        if (rolesRes.ok) {
          const data = await rolesRes.json();
          setRoles(data);
        }
        if (officesRes.ok) {
          const data = await officesRes.json();
          setOffices(data);
        }
        if (managersRes.ok) {
          const data = await managersRes.json();
          setManagers(data);
        }
      } catch (error) {
        console.error("Error fetching options:", error);
      }
    }
    fetchOptions();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const body: Record<string, string> = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        roleId: formData.roleId,
        status: formData.status,
      };
      if (formData.phone) body.phone = formData.phone;
      if (formData.officeId) body.officeId = formData.officeId;
      if (formData.reportsToId) body.reportsToId = formData.reportsToId;
      if (formData.hireDate) body.hireDate = formData.hireDate;

      const response = await fetch("/api/people", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        alert(data.error || "Failed to create person");
        return;
      }

      router.push(data.id ? `/people/${data.id}` : "/people");
      router.refresh();
    } catch (error) {
      console.error("Error creating person:", error);
      alert("Failed to create person");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="firstName">First Name *</Label>
          <Input
            id="firstName"
            value={formData.firstName}
            onChange={(e) =>
              setFormData({ ...formData, firstName: e.target.value })
            }
            required
          />
        </div>
        <div>
          <Label htmlFor="lastName">Last Name *</Label>
          <Input
            id="lastName"
            value={formData.lastName}
            onChange={(e) =>
              setFormData({ ...formData, lastName: e.target.value })
            }
            required
          />
        </div>
      </div>
      <div>
        <Label htmlFor="email">Email *</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
        />
      </div>
      <div>
        <Label htmlFor="phone">Phone</Label>
        <Input
          id="phone"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
        />
      </div>
      <div>
        <Label htmlFor="roleId">Role *</Label>
        <Select
          value={formData.roleId}
          onValueChange={(value) =>
            setFormData({ ...formData, roleId: value })
          }
          required
        >
          <SelectTrigger id="roleId">
            <SelectValue placeholder="Select role" />
          </SelectTrigger>
          <SelectContent>
            {roles.map((role) => (
              <SelectItem key={role.id} value={role.id}>
                {role.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="officeId">Office</Label>
        <Select
          value={formData.officeId}
          onValueChange={(value) =>
            setFormData({ ...formData, officeId: value })
          }
        >
          <SelectTrigger id="officeId">
            <SelectValue placeholder="Select office" />
          </SelectTrigger>
          <SelectContent>
            {offices.map((office) => (
              <SelectItem key={office.id} value={office.id}>
                {office.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="reportsToId">Reports To</Label>
        <Select
          value={formData.reportsToId}
          onValueChange={(value) =>
            setFormData({ ...formData, reportsToId: value })
          }
        >
          <SelectTrigger id="reportsToId">
            <SelectValue placeholder="Select manager" />
          </SelectTrigger>
          <SelectContent>
            {managers.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                {m.firstName} {m.lastName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="status">Status</Label>
        <Select
          value={formData.status}
          onValueChange={(value: "onboarding" | "active" | "inactive") =>
            setFormData({ ...formData, status: value })
          }
        >
          <SelectTrigger id="status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="onboarding">Onboarding</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="hireDate">Hire Date</Label>
        <Input
          id="hireDate"
          type="date"
          value={formData.hireDate}
          onChange={(e) =>
            setFormData({ ...formData, hireDate: e.target.value })
          }
        />
      </div>
      <div className="flex gap-2 pt-4">
        <Button type="submit" disabled={loading}>
          {loading ? "Creating..." : "Create Person"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/people")}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
