import { useQuery } from "@tanstack/react-query";

export interface Deal {
  deal: {
    id: string;
    customerName: string;
    address: string;
    dealValue: number;
    status: "sold" | "pto" | "installed" | "cancelled";
    setterId: string;
    closerId: string;
    officeId: string;
    soldDate?: string;
    ptoDate?: string;
    installDate?: string;
  };
  setter?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  closer?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  office?: {
    id: string;
    name: string;
  };
}

interface UseDealsParams {
  setterId?: string;
  closerId?: string;
  officeId?: string;
  status?: string;
}

export function useDeals(params: UseDealsParams = {}) {
  const queryParams = new URLSearchParams();
  if (params.setterId) queryParams.append("setterId", params.setterId);
  if (params.closerId) queryParams.append("closerId", params.closerId);
  if (params.officeId) queryParams.append("officeId", params.officeId);
  if (params.status) queryParams.append("status", params.status);

  return useQuery({
    queryKey: ["deals", params],
    queryFn: async () => {
      const response = await fetch(`/api/deals?${queryParams}`);
      if (!response.ok) {
        throw new Error("Failed to fetch deals");
      }
      return response.json() as Promise<Deal[]>;
    },
  });
}

export function useDeal(dealId: string | null) {
  return useQuery({
    queryKey: ["deals", dealId],
    queryFn: async () => {
      if (!dealId) throw new Error("Deal ID is required");
      const response = await fetch(`/api/deals/${dealId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch deal");
      }
      return response.json();
    },
    enabled: !!dealId,
  });
}
