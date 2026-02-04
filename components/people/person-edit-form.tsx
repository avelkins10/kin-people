"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { personFormSchema, type PersonFormData } from "@/lib/validation/person-form";
import { useUpdatePerson } from "@/hooks/use-people-data";
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
import type { PersonWithDetails } from "@/types/people";

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

interface PersonEditFormProps {
  person: PersonWithDetails["person"];
  roles: Role[];
  offices: Office[];
  managers: Manager[];
  onSave: () => void;
  onCancel: () => void;
}

export function PersonEditForm({
  person,
  roles,
  offices,
  managers,
  onSave,
  onCancel,
}: PersonEditFormProps) {
  const updateMutation = useUpdatePerson();

  // Map person status to form status (terminated -> inactive)
  const getFormStatus = (status: string | null | undefined): PersonFormData["status"] => {
    if (status === "terminated") return "inactive";
    if (status === "active" || status === "onboarding") return status;
    return "active";
  };

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm<PersonFormData>({
    resolver: zodResolver(personFormSchema),
    defaultValues: {
      firstName: person.firstName || "",
      lastName: person.lastName || "",
      email: person.email || "",
      phone: person.phone || "",
      roleId: person.roleId || "",
      officeId: person.officeId || "",
      reportsToId: person.reportsToId || "",
      status: getFormStatus(person.status),
      hireDate: person.hireDate ? person.hireDate.toString().split("T")[0] : "",
    },
  });

  const roleId = watch("roleId");
  const officeId = watch("officeId");
  const reportsToId = watch("reportsToId");
  const status = watch("status");

  async function onSubmit(data: PersonFormData) {
    try {
      // API handles status mapping (inactive -> terminated) and empty string -> null conversion
      await updateMutation.mutateAsync({
        id: person.id,
        data,
      });
      onSave();
    } catch (error) {
      // Error is already handled by mutation's onError, but we catch here
      // to prevent onSave from being called on failure
      console.error("Failed to update person:", error);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 bg-white border border-gray-200 rounded-sm p-6 shadow-sm">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="firstName">First Name *</Label>
          <Input id="firstName" {...register("firstName")} />
          {errors.firstName && (
            <p className="text-sm text-red-500 mt-1">{errors.firstName.message}</p>
          )}
        </div>
        <div>
          <Label htmlFor="lastName">Last Name *</Label>
          <Input id="lastName" {...register("lastName")} />
          {errors.lastName && (
            <p className="text-sm text-red-500 mt-1">{errors.lastName.message}</p>
          )}
        </div>
      </div>
      <div>
        <Label htmlFor="email">Email *</Label>
        <Input id="email" type="email" {...register("email")} />
        {errors.email && (
          <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>
        )}
      </div>
      <div>
        <Label htmlFor="phone">Phone</Label>
        <Input id="phone" {...register("phone")} />
        {errors.phone && (
          <p className="text-sm text-red-500 mt-1">{errors.phone.message}</p>
        )}
      </div>
      <div>
        <Label htmlFor="roleId">Role *</Label>
        <Select value={roleId} onValueChange={(value) => setValue("roleId", value)}>
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
        <Select value={officeId || ""} onValueChange={(value) => setValue("officeId", value)}>
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
          value={reportsToId || ""}
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
        <Input id="hireDate" type="date" {...register("hireDate")} />
        {errors.hireDate && (
          <p className="text-sm text-red-500 mt-1">{errors.hireDate.message}</p>
        )}
      </div>
      <div className="flex gap-2 pt-4">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save Changes"}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
