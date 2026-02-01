import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { payPlans, commissionRules, personPayPlans } from "@/lib/db/schema";
import { eq, and, isNull, sql } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { hasPermission } from "@/lib/auth/check-permission";
import { Permission } from "@/lib/permissions/types";
import { PayPlansTab } from "@/components/settings/pay-plans-tab";
import { CommissionRulesTab } from "@/components/settings/commission-rules-tab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default async function SettingsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  // Check if user has permission to view settings
  if (!hasPermission(user, Permission.MANAGE_SETTINGS)) {
    redirect("/dashboard");
  }

  // Fetch initial data
  const [allPayPlans, commissionRulesList, activePayPlansCount, activeRulesCount] = await Promise.all([
    db.select().from(payPlans).orderBy(payPlans.name),
    db
      .select()
      .from(commissionRules)
      .orderBy(commissionRules.sortOrder, commissionRules.createdAt),
    db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(payPlans)
      .where(eq(payPlans.isActive, true)),
    db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(commissionRules)
      .where(eq(commissionRules.isActive, true)),
  ]);

  // Fetch counts for each pay plan
  const payPlansList = await Promise.all(
    allPayPlans.map(async (plan) => {
      const [rulesCount, peopleCount] = await Promise.all([
        db
          .select({ count: sql<number>`COUNT(*)::int` })
          .from(commissionRules)
          .where(eq(commissionRules.payPlanId, plan.id)),
        db
          .select({ count: sql<number>`COUNT(DISTINCT ${personPayPlans.personId})::int` })
          .from(personPayPlans)
          .where(
            and(
              eq(personPayPlans.payPlanId, plan.id),
              isNull(personPayPlans.endDate)
            )
          ),
      ]);

      return {
        ...plan,
        rulesCount: rulesCount[0]?.count || 0,
        peopleCount: peopleCount[0]?.count || 0,
      };
    })
  );

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Settings</h2>
        <p className="text-gray-600 mt-1">
          Manage pay plans and commission rules
        </p>
      </div>

      <Tabs defaultValue="pay-plans" className="space-y-6">
        <TabsList>
          <TabsTrigger value="pay-plans">
            Pay Plans ({activePayPlansCount[0]?.count || 0})
          </TabsTrigger>
          <TabsTrigger value="commission-rules">
            Commission Rules ({activeRulesCount[0]?.count || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pay-plans">
          <PayPlansTab initialData={payPlansList} />
        </TabsContent>

        <TabsContent value="commission-rules">
          <CommissionRulesTab initialData={commissionRulesList} />
        </TabsContent>
      </Tabs>
    </main>
  );
}
