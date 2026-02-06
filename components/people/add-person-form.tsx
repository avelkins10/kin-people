"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { personFormSchema, type PersonFormData } from "@/lib/validation/person-form";
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
import { toast } from "@/hooks/use-toast";

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
  const [roles, setRoles] = useState<Role[]>([]);
  const [offices, setOffices] = useState<Office[]>([]);
  const [managers, setManagers] = useState<Manager[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm<PersonFormData>({
    resolver: zodResolver(personFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      roleId: "",
      officeId: "",
      reportsToId: "",
      status: "active",
      hireDate: "",
    },
  });

  const roleId = watch("roleId");
  const officeId = watch("officeId");
  const reportsToId = watch("reportsToId");
  const status = watch("status");

  useEffect(() => {
    async function fetchOptions() {
      try {
        const [rolesRes, officesRes, managersRes] = await Promise.all([
          fetch("/api/roles?active=true"),
          fetch("/api/offices?active=true&scoped=true"),
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

  async function onSubmit(data: PersonFormData) {
    try {
      const body: Record<string, string> = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        roleId: data.roleId,
        status: data.status,
      };
      if (data.phone) body.phone = data.phone;
      if (data.officeId) body.officeId = data.officeId;
      if (data.reportsToId) body.reportsToId = data.reportsToId;
      if (data.hireDate) body.hireDate = data.hireDate;

      const response = await fetch("/api/people", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const responseData = await response.json().catch(() => ({}));

      if (!response.ok) {
        toast({
          title: "Error",
          description: responseData.error || "Failed to create person",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Person created successfully",
      });
      router.push(responseData.id ? `/people/${responseData.id}` : "/people");
      router.refresh();
    } catch (error) {
      console.error("Error creating person:", error);
      toast({
        title: "Error",
        description: "Failed to create person",
        variant: "destructive",
      });
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="firstName">First Name *</Label>
          <Input
            id="firstName"
            {...register("firstName")}
          />
          {errors.firstName && (
            <p className="text-sm text-red-500 mt-1">{errors.firstName.message}</p>
          )}
        </div>
        <div>
          <Label htmlFor="lastName">Last Name *</Label>
          <Input
            id="lastName"
            {...register("lastName")}
          />
          {errors.lastName && (
            <p className="text-sm text-red-500 mt-1">{errors.lastName.message}</p>
          )}
        </div>
      </div>
      <div>
        <Label htmlFor="email">Email *</Label>
        <Input
          id="email"
          type="email"
          {...register("email")}
        />
        {errors.email && (
          <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>
        )}
      </div>
      <div>
        <Label htmlFor="phone">Phone</Label>
        <Input
          id="phone"
          {...register("phone")}
        />
        {errors.phone && (
          <p className="text-sm text-red-500 mt-1">{errors.phone.message}</p>
        )}
      </div>
      <div>
        <Label htmlFor="roleId">Role *</Label>
        <Select
          value={roleId}
          onValueChange={(value) => setValue("roleId", value)}
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
        {errors.roleId && (
          <p className="text-sm text-red-500 mt-1">{errors.roleId.message}</p>
        )}
      </div>
      <div>
        <Label htmlFor="officeId">Office</Label>
        <Select
          value={officeId}
          onValueChange={(value) => setValue("officeId", value)}
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
        {errors.officeId && (
          <p className="text-sm text-red-500 mt-1">{errors.officeId.message}</p>
        )}
      </div>
      <div>
        <Label htmlFor="reportsToId">Reports To</Label>
        <Select
          value={reportsToId}
          onValueChange={(value) => setValue("reportsToId", value)}
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
        {errors.reportsToId && (
          <p className="text-sm text-red-500 mt-1">{errors.reportsToId.message}</p>
        )}
      </div>
      <div>
        <Label htmlFor="status">Status</Label>
        <Select
          value={status}
          onValueChange={(value: "onboarding" | "active" | "inactive") =>
            setValue("status", value)
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
        {errors.status && (
          <p className="text-sm text-red-500 mt-1">{errors.status.message}</p>
        )}
      </div>
      <div>
        <Label htmlFor="hireDate">Hire Date</Label>
        <Input
          id="hireDate"
          type="date"
          {...register("hireDate")}
        />
        {errors.hireDate && (
          <p className="text-sm text-red-500 mt-1">{errors.hireDate.message}</p>
        )}
      </div>
      <div className="flex gap-2 pt-4">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Creating..." : "Create Person"}
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
