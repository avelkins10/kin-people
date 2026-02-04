import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";

export interface Person {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  status: "active" | "onboarding" | "terminated";
  hireDate: string;
  terminationDate?: string;
  officeId?: string;
  roleId?: string;
  reportsToId?: string;
  role?: { id: string; name: string };
  office?: { id: string; name: string };
  manager?: { id: string; firstName: string; lastName: string };
}

export interface Office {
  id: string;
  name: string;
}

export interface Role {
  id: string;
  name: string;
}

interface UsePeopleParams {
  status?: string;
  officeId?: string;
  roleId?: string;
  search?: string;
}

export function usePeople(params: UsePeopleParams = {}) {
  const queryParams = new URLSearchParams();
  if (params.status) queryParams.append("status", params.status);
  if (params.officeId) queryParams.append("officeId", params.officeId);
  if (params.roleId) queryParams.append("roleId", params.roleId);
  if (params.search) queryParams.append("search", params.search);

  return useQuery({
    queryKey: ["people", params],
    queryFn: async () => {
      const response = await fetch(`/api/people?${queryParams}`);
      if (!response.ok) {
        throw new Error("Failed to fetch people");
      }
      return response.json() as Promise<Person[]>;
    },
  });
}

export function usePerson(personId: string | null) {
  return useQuery({
    queryKey: ["people", personId],
    queryFn: async () => {
      if (!personId) throw new Error("Person ID is required");
      const response = await fetch(`/api/people/${personId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch person");
      }
      return response.json() as Promise<Person>;
    },
    enabled: !!personId,
  });
}

export function useOffices() {
  return useQuery({
    queryKey: ["offices"],
    queryFn: async () => {
      const response = await fetch("/api/offices");
      if (!response.ok) {
        throw new Error("Failed to fetch offices");
      }
      return response.json() as Promise<Office[]>;
    },
  });
}

export function useRoles() {
  return useQuery({
    queryKey: ["roles"],
    queryFn: async () => {
      const response = await fetch("/api/roles");
      if (!response.ok) {
        throw new Error("Failed to fetch roles");
      }
      return response.json() as Promise<Role[]>;
    },
  });
}

export function useUpdatePerson() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Person> }) => {
      const response = await fetch(`/api/people/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || "Failed to update person");
      }
      return response.json() as Promise<Person>;
    },
    onSuccess: (updated, { id }) => {
      toast({
        title: "Success",
        description: "Person updated successfully",
      });
      // Invalidate person detail query
      queryClient.invalidateQueries({ queryKey: ["people", id] });
      // Invalidate people list query
      queryClient.invalidateQueries({ queryKey: ["people"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update person",
        variant: "destructive",
      });
    },
  });
}
