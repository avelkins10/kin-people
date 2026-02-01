"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CommissionsFilters } from "./commissions-filters";
import { CommissionsTable } from "./commissions-table";

interface CommissionsTabsProps {
  activeTab: string;
  commissionsData: any[];
  currentUserId: string;
  canApprove: boolean;
}

export function CommissionsTabs({
  activeTab,
  commissionsData,
  currentUserId,
  canApprove,
}: CommissionsTabsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function handleTabChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", value);
    router.push(`/commissions?${params.toString()}`);
  }

  function handleRefresh() {
    router.refresh();
  }

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
      <TabsList>
        <TabsTrigger value="my-deals">My Deals</TabsTrigger>
        <TabsTrigger value="overrides">Override Commissions</TabsTrigger>
      </TabsList>

      <TabsContent value="my-deals" className="space-y-4">
        <CommissionsFilters />
        <CommissionsTable
          commissions={commissionsData.filter(
            (item: any) => !item.commission.commissionType.startsWith("override_")
          )}
          currentUserId={currentUserId}
          canApprove={canApprove}
          onRefresh={handleRefresh}
        />
      </TabsContent>

      <TabsContent value="overrides" className="space-y-4">
        <CommissionsFilters />
        <CommissionsTable
          commissions={commissionsData.filter((item: any) =>
            item.commission.commissionType.startsWith("override_")
          )}
          currentUserId={currentUserId}
          canApprove={canApprove}
          onRefresh={handleRefresh}
        />
      </TabsContent>
    </Tabs>
  );
}
