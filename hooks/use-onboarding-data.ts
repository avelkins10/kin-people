import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface OnboardingTaskWithProgress {
  id: string;
  title: string;
  description: string | null;
  category: string;
  taskOrder: number;
  completed: boolean;
  completedAt: string | null;
  completedBy: string | null;
  notes: string | null;
}

export interface OnboardingProgress {
  tasks: OnboardingTaskWithProgress[];
  completedCount: number;
  totalCount: number;
  percentComplete: number;
}

export function useOnboardingTasks(personId: string) {
  return useQuery<OnboardingProgress>({
    queryKey: ["onboarding", personId],
    queryFn: async () => {
      const res = await fetch(`/api/people/${personId}/onboarding`);
      if (!res.ok) {
        throw new Error("Failed to fetch onboarding tasks");
      }
      return res.json();
    },
    enabled: !!personId,
  });
}

export function useToggleOnboardingTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      personId,
      taskId,
    }: {
      personId: string;
      taskId: string;
    }) => {
      const res = await fetch(`/api/people/${personId}/onboarding/${taskId}`, {
        method: "PATCH",
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.error || "Failed to toggle task");
      }
      return res.json();
    },
    onSuccess: (_, { personId }) => {
      queryClient.invalidateQueries({ queryKey: ["onboarding", personId] });
    },
  });
}

export function useAllOnboardingTasks() {
  return useQuery({
    queryKey: ["onboarding-tasks-all"],
    queryFn: async () => {
      const res = await fetch("/api/onboarding-tasks");
      if (!res.ok) {
        throw new Error("Failed to fetch onboarding tasks");
      }
      return res.json();
    },
  });
}

export function useCreateOnboardingTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      title: string;
      description?: string;
      category: string;
      taskOrder: number;
    }) => {
      const res = await fetch("/api/onboarding-tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.error || "Failed to create task");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["onboarding-tasks-all"] });
    },
  });
}

export function useUpdateOnboardingTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<{
        title: string;
        description: string;
        category: string;
        taskOrder: number;
        isActive: boolean;
      }>;
    }) => {
      const res = await fetch(`/api/onboarding-tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.error || "Failed to update task");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["onboarding-tasks-all"] });
    },
  });
}

export function useDeleteOnboardingTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/onboarding-tasks/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.error || "Failed to delete task");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["onboarding-tasks-all"] });
    },
  });
}
