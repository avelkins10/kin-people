import { useQuery } from "@tanstack/react-query";

export interface Commission {
  commission: {
    id: string;
    dealId: string;
    personId: string;
    commissionType: string;
    amount: number;
    status: "pending" | "approved" | "paid";
    paidDate?: string;
  };
  deal?: {
    id: string;
    customerName: string;
    dealValue: number;
    status: string;
  };
  person?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

interface UseCommissionsParams {
  personId?: string;
  dealId?: string;
  status?: string;
}

export function useCommissions(params: UseCommissionsParams = {}) {
  const queryParams = new URLSearchParams();
  if (params.personId) queryParams.append("personId", params.personId);
  if (params.dealId) queryParams.append("dealId", params.dealId);
  if (params.status) queryParams.append("status", params.status);

  return useQuery({
    queryKey: ["commissions", params],
    queryFn: async () => {
      const response = await fetch(`/api/commissions?${queryParams}`);
      if (!response.ok) {
        throw new Error("Failed to fetch commissions");
      }
      return response.json() as Promise<Commission[]>;
    },
  });
}
