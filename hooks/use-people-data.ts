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
  regionId: string | null;
  region: string | null;
}

export interface Role {
  id: string;
  name: string;
}

interface UsePeopleParams {
  status?: string;
  officeId?: string;
  roleId?: string;
  roleLevel?: string;
  search?: string;
}

export function usePeople(params: UsePeopleParams = {}) {
  const queryParams = new URLSearchParams();
  if (params.status) queryParams.append("status", params.status);
  if (params.officeId) queryParams.append("officeId", params.officeId);
  if (params.roleId) queryParams.append("roleId", params.roleId);
  if (params.roleLevel) queryParams.append("roleLevel", params.roleLevel);
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

export function useRegions() {
  return useQuery({
    queryKey: ["regions"],
    queryFn: async () => {
      const response = await fetch("/api/regions");
      if (!response.ok) {
        throw new Error("Failed to fetch regions");
      }
      return response.json() as Promise<Array<{ id: string; name: string; isActive: boolean | null }>>;
    },
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

// Type for update data - accepts form status values (API handles mapping)
type UpdatePersonData = Omit<Partial<Person>, 'status'> & {
  status?: "active" | "onboarding" | "inactive" | "terminated";
};

export function useUpdatePerson() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdatePersonData }) => {
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

export interface AuthStatus {
  status: "not_invited" | "invited" | "active";
  lastSignInAt: string | null;
  invitedAt: string | null;
  emailConfirmed: boolean;
}

export function useAuthStatus(personId: string | null) {
  return useQuery({
    queryKey: ["auth-status", personId],
    queryFn: async () => {
      if (!personId) throw new Error("Person ID is required");
      const response = await fetch(`/api/people/${personId}/auth-status`);
      if (!response.ok) {
        throw new Error("Failed to fetch auth status");
      }
      return response.json() as Promise<AuthStatus>;
    },
    enabled: !!personId,
  });
}

export function useResendInvite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (personId: string) => {
      const response = await fetch(`/api/people/${personId}/resend-invite`, {
        method: "POST",
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error((error as { error?: string }).error ?? "Failed to send invite");
      }
      return response.json();
    },
    onSuccess: (_, personId) => {
      toast({
        title: "Invite sent",
        description: "The invitation email has been sent.",
      });
      queryClient.invalidateQueries({ queryKey: ["auth-status", personId] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send invite",
        variant: "destructive",
      });
    },
  });
}

export function useRemovePerson() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/people/${id}/remove`, { method: "DELETE" });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error((error as { error?: string }).error ?? "Failed to remove person");
      }
    },
    onSuccess: (_, id) => {
      toast({
        title: "Person removed",
        description: "The person has been permanently removed.",
      });
      queryClient.invalidateQueries({ queryKey: ["people", id] });
      queryClient.invalidateQueries({ queryKey: ["people"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to remove person",
        variant: "destructive",
      });
    },
  });
}
