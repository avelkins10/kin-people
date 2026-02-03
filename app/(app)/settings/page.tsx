import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { payPlans, commissionRules, personPayPlans, roles, offices } from "@/lib/db/schema";
import { eq, and, isNull, sql } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { hasPermission } from "@/lib/auth/check-permission";
import { Permission } from "@/lib/permissions/types";
import { PayPlansTab } from "@/components/settings/pay-plans-tab";
import { CommissionRulesTab } from "@/components/settings/commission-rules-tab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import {
  Settings,
  Users,
  Building2,
  CreditCard,
  Plus,
  ChevronRight,
  MoreHorizontal,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (!hasPermission(user, Permission.MANAGE_SETTINGS)) {
    redirect("/dashboard");
  }

  const tab = (searchParams.tab as string) || "roles";

  const [allPayPlans, commissionRulesList, activePayPlansCount, activeRulesCount, rolesList, officesList] =
    await Promise.all([
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
      db.select().from(roles).where(eq(roles.isActive, true)).orderBy(roles.name),
      db.select().from(offices).where(eq(offices.isActive, true)).orderBy(offices.name),
    ]);

  const payPlansList = await Promise.all(
    allPayPlans.map(async (plan) => {
      const [rulesCount, peopleCount] = await Promise.all([
        db
          .select({ count: sql<number>`COUNT(*)::int` })
          .from(commissionRules)
          .where(eq(commissionRules.payPlanId, plan.id)),
        db
          .select({
            count: sql<number>`COUNT(DISTINCT ${personPayPlans.personId})::int`,
          })
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

  const tabs = [
    { id: "roles", label: "Roles", icon: Users, count: rolesList.length },
    { id: "offices", label: "Offices", icon: Building2, count: officesList.length },
    { id: "pay-plans", label: "Pay Plans", icon: CreditCard, count: activePayPlansCount[0]?.count || 0 },
  ];

  return (
    <>
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tighter text-black mb-1 uppercase">
            Settings
          </h1>
          <p className="text-gray-500 font-medium">
            Manage roles, offices, and pay plans for your organization.
          </p>
        </div>
      </header>

      {/* Three Column Layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Roles Column */}
        <div className="bg-white border border-gray-100 rounded-sm">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-bold uppercase tracking-wide">
                Roles
              </span>
              <span className="text-xs text-gray-400">{rolesList.length}</span>
            </div>
            <button className="p-1 hover:bg-gray-100 rounded-sm transition-colors">
              <Plus className="w-4 h-4 text-gray-400" />
            </button>
          </div>
          <div className="divide-y divide-gray-50">
            {rolesList.map((role) => (
              <div
                key={role.id}
                className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer group"
              >
                <div>
                  <div className="font-bold text-sm text-gray-900">
                    {role.name}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    Level {role.level || 0}
                  </div>
                </div>
                <button className="p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreHorizontal className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            ))}
            {rolesList.length === 0 && (
              <div className="px-6 py-8 text-center text-gray-400 text-sm">
                No roles found
              </div>
            )}
          </div>
        </div>

        {/* Offices Column */}
        <div className="bg-white border border-gray-100 rounded-sm">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-bold uppercase tracking-wide">
                Offices
              </span>
              <span className="text-xs text-gray-400">{officesList.length}</span>
            </div>
            <button className="p-1 hover:bg-gray-100 rounded-sm transition-colors">
              <Plus className="w-4 h-4 text-gray-400" />
            </button>
          </div>
          <div className="divide-y divide-gray-50">
            {officesList.map((office) => (
              <div
                key={office.id}
                className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer group"
              >
                <div>
                  <div className="font-bold text-sm text-gray-900">
                    {office.name}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {office.region || "No region"}
                  </div>
                </div>
                <button className="p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreHorizontal className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            ))}
            {officesList.length === 0 && (
              <div className="px-6 py-8 text-center text-gray-400 text-sm">
                No offices found
              </div>
            )}
          </div>
        </div>

        {/* Pay Plans Column */}
        <div className="bg-white border border-gray-100 rounded-sm">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-bold uppercase tracking-wide">
                Pay Plans
              </span>
              <span className="text-xs text-gray-400">
                {payPlansList.length}
              </span>
            </div>
            <button className="p-1 hover:bg-gray-100 rounded-sm transition-colors">
              <Plus className="w-4 h-4 text-gray-400" />
            </button>
          </div>
          <div className="divide-y divide-gray-50">
            {payPlansList.map((plan) => (
              <div
                key={plan.id}
                className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer group"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-gray-900">
                      {plan.name}
                    </span>
                    {!plan.isActive && (
                      <Badge className="bg-gray-100 text-gray-500 border-0 text-[10px]">
                        INACTIVE
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {plan.rulesCount} rules, {plan.peopleCount} people
                  </div>
                </div>
                <button className="p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreHorizontal className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            ))}
            {payPlansList.length === 0 && (
              <div className="px-6 py-8 text-center text-gray-400 text-sm">
                No pay plans found
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Commission Rules Section */}
      <div className="mt-8">
        <div className="bg-white border border-gray-100 rounded-sm">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-bold uppercase tracking-wide">
                Commission Rules
              </span>
              <span className="text-xs text-gray-400">
                {activeRulesCount[0]?.count || 0} active
              </span>
            </div>
            <button className="inline-flex items-center gap-2 px-3 py-1.5 bg-black text-white rounded-sm text-xs font-bold hover:bg-gray-800 transition-colors">
              <Plus className="w-3 h-3" /> Add Rule
            </button>
          </div>
          <div className="p-6">
            <CommissionRulesTab initialData={commissionRulesList} />
          </div>
        </div>
      </div>
    </>
  );
}
