import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";

// ---------------------------------------------------------------------------
// Account hooks
// ---------------------------------------------------------------------------

export function useRepcardAccount(personId: string | null) {
  return useQuery({
    queryKey: ["repcard-account", personId],
    queryFn: async () => {
      if (!personId) throw new Error("Person ID is required");
      const response = await fetch(`/api/integrations/repcard/accounts/${personId}`);
      if (response.status === 404) return null;
      if (!response.ok) throw new Error("Failed to fetch RepCard account");
      return response.json();
    },
    enabled: !!personId,
  });
}

export function useCreateRepcardAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { personId: string; username: string; jobTitle?: string }) => {
      const response = await fetch("/api/integrations/repcard/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error((error as { error?: string }).error || "Failed to create RepCard account");
      }
      return response.json();
    },
    onSuccess: (_, variables) => {
      toast({ title: "Success", description: "RepCard account created successfully" });
      queryClient.invalidateQueries({ queryKey: ["repcard-account", variables.personId] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create RepCard account",
        variant: "destructive",
      });
    },
  });
}

export function useUpdateRepcardAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ personId, data }: { personId: string; data: Record<string, string | undefined> }) => {
      const response = await fetch(`/api/integrations/repcard/accounts/${personId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error((error as { error?: string }).error || "Failed to update RepCard account");
      }
      return response.json();
    },
    onSuccess: (_, { personId }) => {
      toast({ title: "Success", description: "RepCard account updated successfully" });
      queryClient.invalidateQueries({ queryKey: ["repcard-account", personId] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update RepCard account",
        variant: "destructive",
      });
    },
  });
}

export function useDeactivateRepcardAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (personId: string) => {
      const response = await fetch(`/api/integrations/repcard/accounts/${personId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error((error as { error?: string }).error || "Failed to deactivate RepCard account");
      }
      return response.json();
    },
    onSuccess: (_, personId) => {
      toast({ title: "Success", description: "RepCard account deactivated" });
      queryClient.invalidateQueries({ queryKey: ["repcard-account", personId] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to deactivate RepCard account",
        variant: "destructive",
      });
    },
  });
}

export function useActivateRepcardAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (personId: string) => {
      const response = await fetch(`/api/integrations/repcard/accounts/${personId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reactivate: true }),
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error((error as { error?: string }).error || "Failed to activate RepCard account");
      }
      return response.json();
    },
    onSuccess: (_, personId) => {
      toast({ title: "Success", description: "RepCard account reactivated" });
      queryClient.invalidateQueries({ queryKey: ["repcard-account", personId] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to activate RepCard account",
        variant: "destructive",
      });
    },
  });
}

export function useUnlinkRepcardAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (personId: string) => {
      const response = await fetch(`/api/integrations/repcard/accounts/${personId}?unlink=true`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error((error as { error?: string }).error || "Failed to unlink RepCard account");
      }
      return response.json();
    },
    onSuccess: (_, personId) => {
      toast({ title: "Success", description: "RepCard account unlinked" });
      queryClient.invalidateQueries({ queryKey: ["repcard-account", personId] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to unlink RepCard account",
        variant: "destructive",
      });
    },
  });
}

export function useSyncRepcardAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (personId: string) => {
      const response = await fetch(`/api/integrations/repcard/accounts/${personId}/sync`, {
        method: "POST",
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error((error as { error?: string }).error || "Failed to sync RepCard account");
      }
      return response.json();
    },
    onSuccess: (_, personId) => {
      toast({ title: "Success", description: "RepCard account synced" });
      queryClient.invalidateQueries({ queryKey: ["repcard-account", personId] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to sync RepCard account",
        variant: "destructive",
      });
    },
  });
}

export function useLinkRepcardAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ personId, repcardUserId }: { personId: string; repcardUserId: string }) => {
      const response = await fetch(`/api/integrations/repcard/accounts/${personId}/link`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repcardUserId }),
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error((error as { error?: string }).error || "Failed to link RepCard account");
      }
      return response.json();
    },
    onSuccess: (_, { personId }) => {
      toast({ title: "Success", description: "RepCard account linked successfully" });
      queryClient.invalidateQueries({ queryKey: ["repcard-account", personId] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to link RepCard account",
        variant: "destructive",
      });
    },
  });
}

export function useSearchRepcardUsers(query: string) {
  return useQuery({
    queryKey: ["repcard-search", query],
    queryFn: async () => {
      const response = await fetch(`/api/integrations/repcard/search?q=${encodeURIComponent(query)}`);
      if (!response.ok) throw new Error("Failed to search RepCard users");
      return response.json();
    },
    enabled: query.length >= 2,
  });
}

// ---------------------------------------------------------------------------
// RepCard reference data (offices, teams, roles from RepCard API)
// ---------------------------------------------------------------------------

export function useRepcardOptions() {
  return useQuery({
    queryKey: ["repcard-options"],
    queryFn: async () => {
      const response = await fetch("/api/integrations/repcard/options");
      if (!response.ok) throw new Error("Failed to fetch RepCard options");
      return response.json() as Promise<{
        offices: Array<{ id: number; officeName: string; officeCity?: string; officeState?: string }>;
        teams: Array<{ id: number; officeId: number; teamName: string; officeName: string }>;
        roles: Array<{ id: number; name: string }>;
      }>;
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
}

// ---------------------------------------------------------------------------
// Mapping & permission hooks
// ---------------------------------------------------------------------------

export function useRepcardRegionMappings() {
  return useQuery({
    queryKey: ["repcard-region-mappings"],
    queryFn: async () => {
      const response = await fetch("/api/integrations/repcard/mappings/regions");
      if (!response.ok) throw new Error("Failed to fetch region mappings");
      return response.json();
    },
  });
}

export function useUpdateRepcardRegionMappings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (mappings: Array<{ regionId: string; repcardOffice: string }>) => {
      const response = await fetch("/api/integrations/repcard/mappings/regions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mappings),
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error((error as { error?: string }).error || "Failed to update region mappings");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Region mappings updated" });
      queryClient.invalidateQueries({ queryKey: ["repcard-region-mappings"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update mappings",
        variant: "destructive",
      });
    },
  });
}

export function useRepcardOfficeMappings() {
  return useQuery({
    queryKey: ["repcard-office-mappings"],
    queryFn: async () => {
      const response = await fetch("/api/integrations/repcard/mappings/offices");
      if (!response.ok) throw new Error("Failed to fetch office mappings");
      return response.json();
    },
  });
}

export function useRepcardRoleMappings() {
  return useQuery({
    queryKey: ["repcard-role-mappings"],
    queryFn: async () => {
      const response = await fetch("/api/integrations/repcard/mappings/roles");
      if (!response.ok) throw new Error("Failed to fetch role mappings");
      return response.json();
    },
  });
}

export function useRepcardPermissions() {
  return useQuery({
    queryKey: ["repcard-permissions"],
    queryFn: async () => {
      const response = await fetch("/api/integrations/repcard/permissions");
      if (!response.ok) throw new Error("Failed to fetch RepCard permissions");
      return response.json();
    },
  });
}

export function useUpdateRepcardOfficeMappings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (mappings: Array<{ officeId: string; repcardOffice: string; repcardTeam?: string }>) => {
      const response = await fetch("/api/integrations/repcard/mappings/offices", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mappings),
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error((error as { error?: string }).error || "Failed to update office mappings");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Office mappings updated" });
      queryClient.invalidateQueries({ queryKey: ["repcard-office-mappings"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update mappings",
        variant: "destructive",
      });
    },
  });
}

export function useUpdateRepcardRoleMappings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (mappings: Array<{ roleId: string; repcardRole: string }>) => {
      const response = await fetch("/api/integrations/repcard/mappings/roles", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mappings),
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error((error as { error?: string }).error || "Failed to update role mappings");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Role mappings updated" });
      queryClient.invalidateQueries({ queryKey: ["repcard-role-mappings"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update mappings",
        variant: "destructive",
      });
    },
  });
}

export function useUpdateRepcardPermissions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (permissions: Array<{ roleId: string; canCreate: boolean; canEdit: boolean; canDeactivate: boolean; canLink: boolean; canSync: boolean }>) => {
      const response = await fetch("/api/integrations/repcard/permissions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(permissions),
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error((error as { error?: string }).error || "Failed to update permissions");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "RepCard permissions updated" });
      queryClient.invalidateQueries({ queryKey: ["repcard-permissions"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update permissions",
        variant: "destructive",
      });
    },
  });
}
