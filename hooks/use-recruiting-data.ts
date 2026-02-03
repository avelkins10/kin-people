import { useQuery } from "@tanstack/react-query";
import type { RecruitListItem } from "@/types/recruiting";

interface UseRecruitsParams {
  stage?: string;
  recruiterId?: string;
  officeId?: string;
  status?: string;
}

export function useRecruits(params: UseRecruitsParams = {}) {
  const queryParams = new URLSearchParams();
  if (params.stage) queryParams.append("stage", params.stage);
  if (params.recruiterId) queryParams.append("recruiterId", params.recruiterId);
  if (params.officeId) queryParams.append("officeId", params.officeId);
  if (params.status) queryParams.append("status", params.status);

  return useQuery({
    queryKey: ["recruits", params],
    queryFn: async () => {
      const response = await fetch(`/api/recruits?${queryParams}`);
      if (!response.ok) {
        throw new Error("Failed to fetch recruits");
      }
      return response.json() as Promise<RecruitListItem[]>;
    },
  });
}

export function useRecruit(recruitId: string | null) {
  return useQuery({
    queryKey: ["recruits", recruitId],
    queryFn: async () => {
      if (!recruitId) throw new Error("Recruit ID is required");
      const response = await fetch(`/api/recruits/${recruitId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch recruit");
      }
      return response.json() as Promise<RecruitListItem>;
    },
    enabled: !!recruitId,
  });
}
