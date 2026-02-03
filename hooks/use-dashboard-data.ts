import { useQuery } from "@tanstack/react-query";

export interface DashboardStats {
  totalPeople: number;
  activeRecruits: number;
  pendingCommissions: number;
  recentDealsCount: number;
  pipelineStageCounts: Record<string, number>;
  onboardingCount: number;
}

export interface OnboardingPerson {
  id: string;
  name: string;
  role?: { name: string };
  office?: { name: string };
  hireDate: string;
  progress: number;
}

export interface RecruitingStats {
  inPipeline: number;
  byStatus: Record<string, number>;
  openPositions: number;
  interviewingCount: number;
  startingSoonCount: number;
  actionItems: Array<{
    recruitId: string;
    reason: string;
    message: string;
  }>;
  actionItemsCount: number;
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ["dashboard", "stats"],
    queryFn: async () => {
      const response = await fetch("/api/dashboard/stats");
      if (!response.ok) {
        throw new Error("Failed to fetch dashboard stats");
      }
      return response.json() as Promise<DashboardStats>;
    },
  });
}

export function useOnboardingPeople() {
  return useQuery({
    queryKey: ["people", "onboarding"],
    queryFn: async () => {
      const response = await fetch("/api/people?status=onboarding");
      if (!response.ok) {
        throw new Error("Failed to fetch onboarding people");
      }
      return response.json() as Promise<OnboardingPerson[]>;
    },
  });
}

export function useRecruitingStats() {
  return useQuery({
    queryKey: ["recruiting", "stats"],
    queryFn: async () => {
      const response = await fetch("/api/recruiting/stats");
      if (!response.ok) {
        throw new Error("Failed to fetch recruiting stats");
      }
      return response.json() as Promise<RecruitingStats>;
    },
  });
}
