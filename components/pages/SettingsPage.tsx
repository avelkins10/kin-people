"use client";

import React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSettingsData } from "@/hooks/use-settings-data";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SettingsOverview } from "@/components/settings/settings-overview";
import { SettingsRolesSection } from "@/components/settings/SettingsRolesSection";
import { SettingsOfficesSection } from "@/components/settings/SettingsOfficesSection";
import { SettingsTeamsSection } from "@/components/settings/SettingsTeamsSection";
import { SettingsPayPlansSection } from "@/components/settings/SettingsPayPlansSection";
import { SettingsCommissionRulesSection } from "@/components/settings/SettingsCommissionRulesSection";
import { SettingsDocumentTemplatesSection } from "@/components/settings/SettingsDocumentTemplatesSection";
import { SettingsOnboardingMetricsSection } from "@/components/settings/SettingsOnboardingMetricsSection";
import { SettingsHistorySection } from "@/components/settings/SettingsHistorySection";
import { SettingsUsersSection } from "@/components/settings/SettingsUsersSection";
import { SettingsIntegrationsSection } from "@/components/settings/SettingsIntegrationsSection";
import {
  LayoutDashboard,
  Users,
  Shield,
  MapPin,
  UsersRound,
  FileText,
  Percent,
  GraduationCap,
  History,
  Plug,
} from "lucide-react";
import { cn } from "@/lib/utils";

const TAB_VALUES = [
  "overview",
  "users",
  "roles",
  "offices",
  "teams",
  "documents",
  "pay-plans",
  "commission-rules",
  "onboarding",
  "history",
  "integrations",
] as const;

export function SettingsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tabFromUrl = searchParams.get("tab");
  const activeTab =
    tabFromUrl && (TAB_VALUES as readonly string[]).includes(tabFromUrl)
      ? tabFromUrl
      : "users";

  const { data, loading, error, refetch } = useSettingsData();

  function handleTabChange(value: string) {
    router.push(`/settings/organization?tab=${value}`);
  }

  const roles = Array.isArray(data.roles) ? data.roles : [];
  const offices = Array.isArray(data.offices) ? data.offices : [];
  const teams = Array.isArray(data.teams) ? data.teams : [];
  const payPlans = Array.isArray(data.payPlans) ? data.payPlans : [];
  const commissionRules = Array.isArray(data.commissionRules) ? data.commissionRules : [];
  const documentTemplates = Array.isArray(data.documentTemplates) ? data.documentTemplates : [];
  const people = Array.isArray(data.people) ? data.people : [];
  const activePayPlans = payPlans.filter((p) => p.isActive).length;
  const totalCommissionRules = commissionRules.length;
  const peopleWithPayPlans = payPlans.reduce((sum, p) => sum + (p.peopleCount ?? 0), 0);
  const peopleWithoutPayPlans = Math.max(0, people.length - peopleWithPayPlans);

  return (
    <div className="space-y-6">
      <header className="shrink-0">
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-black uppercase">
          Organization
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Configure roles, offices, teams, users, and compensation. Changes are saved to the database and apply across the app.
        </p>
      </header>

      {error && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-100 text-red-700 text-sm">
          {error}
        </div>
      )}

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList
          className={cn(
            "w-full justify-start gap-0.5 rounded-none border-b border-gray-200 bg-transparent p-0 h-auto min-h-10",
            "overflow-x-auto flex-nowrap md:flex-wrap"
          )}
        >
          <TabsTrigger
            value="overview"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-black data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3 text-sm font-medium text-gray-600 data-[state=active]:text-black"
          >
            <LayoutDashboard className="h-4 w-4 mr-2 shrink-0" />
            Overview
          </TabsTrigger>
          <TabsTrigger
            value="users"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-black data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3 text-sm font-medium text-gray-600 data-[state=active]:text-black"
          >
            <Users className="h-4 w-4 mr-2 shrink-0" />
            Users
          </TabsTrigger>
          <TabsTrigger
            value="roles"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-black data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3 text-sm font-medium text-gray-600 data-[state=active]:text-black"
          >
            <Shield className="h-4 w-4 mr-2 shrink-0" />
            Roles
          </TabsTrigger>
          <TabsTrigger
            value="offices"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-black data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3 text-sm font-medium text-gray-600 data-[state=active]:text-black"
          >
            <MapPin className="h-4 w-4 mr-2 shrink-0" />
            Offices
          </TabsTrigger>
          <TabsTrigger
            value="teams"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-black data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3 text-sm font-medium text-gray-600 data-[state=active]:text-black"
          >
            <UsersRound className="h-4 w-4 mr-2 shrink-0" />
            Teams
          </TabsTrigger>
          <TabsTrigger
            value="documents"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-black data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3 text-sm font-medium text-gray-600 data-[state=active]:text-black"
          >
            <FileText className="h-4 w-4 mr-2 shrink-0" />
            Documents
          </TabsTrigger>
          <TabsTrigger
            value="pay-plans"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-black data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3 text-sm font-medium text-gray-600 data-[state=active]:text-black"
          >
            <FileText className="h-4 w-4 mr-2 shrink-0" />
            Pay Plans
          </TabsTrigger>
          <TabsTrigger
            value="commission-rules"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-black data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3 text-sm font-medium text-gray-600 data-[state=active]:text-black"
          >
            <Percent className="h-4 w-4 mr-2 shrink-0" />
            Commission
          </TabsTrigger>
          <TabsTrigger
            value="onboarding"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-black data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3 text-sm font-medium text-gray-600 data-[state=active]:text-black"
          >
            <GraduationCap className="h-4 w-4 mr-2 shrink-0" />
            Onboarding
          </TabsTrigger>
          <TabsTrigger
            value="history"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-black data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3 text-sm font-medium text-gray-600 data-[state=active]:text-black"
          >
            <History className="h-4 w-4 mr-2 shrink-0" />
            History
          </TabsTrigger>
          <TabsTrigger
            value="integrations"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-black data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3 text-sm font-medium text-gray-600 data-[state=active]:text-black"
          >
            <Plug className="h-4 w-4 mr-2 shrink-0" />
            Integrations
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6 focus-visible:outline-none">
          <SettingsOverview
            activePayPlans={activePayPlans}
            totalCommissionRules={totalCommissionRules}
            peopleWithoutPayPlans={peopleWithoutPayPlans}
          />
        </TabsContent>

        <TabsContent value="users" className="mt-6 focus-visible:outline-none">
          <div className="max-w-2xl">
            <SettingsUsersSection
              people={people}
              roles={roles}
              offices={offices}
              loading={loading}
              onRefetch={refetch}
            />
          </div>
        </TabsContent>

        <TabsContent value="roles" className="mt-6 focus-visible:outline-none">
          <div className="max-w-2xl">
            <SettingsRolesSection
              roles={roles}
              loading={loading}
              onRefetch={refetch}
            />
          </div>
        </TabsContent>

        <TabsContent value="offices" className="mt-6 focus-visible:outline-none">
          <div className="max-w-2xl">
            <SettingsOfficesSection
              offices={offices}
              people={people}
              loading={loading}
              onRefetch={refetch}
            />
          </div>
        </TabsContent>

        <TabsContent value="teams" className="mt-6 focus-visible:outline-none">
          <div className="max-w-2xl">
            <SettingsTeamsSection
              teams={teams}
              offices={offices}
              loading={loading}
              onRefetch={refetch}
            />
          </div>
        </TabsContent>

        <TabsContent value="documents" className="mt-6 focus-visible:outline-none">
          <div className="max-w-2xl">
            <SettingsDocumentTemplatesSection
              documentTemplates={documentTemplates}
              loading={loading}
              onRefetch={refetch}
            />
          </div>
        </TabsContent>

        <TabsContent value="pay-plans" className="mt-6 focus-visible:outline-none">
          <div className="max-w-2xl">
            <SettingsPayPlansSection
              payPlans={payPlans}
              loading={loading}
              onRefetch={refetch}
            />
          </div>
        </TabsContent>

        <TabsContent value="commission-rules" className="mt-6 focus-visible:outline-none">
          <div className="max-w-3xl">
            <SettingsCommissionRulesSection
              commissionRules={commissionRules}
              payPlans={payPlans}
              loading={loading}
              onRefetch={refetch}
            />
          </div>
        </TabsContent>

        <TabsContent value="onboarding" className="mt-6 focus-visible:outline-none">
          <div className="max-w-2xl">
            <SettingsOnboardingMetricsSection onRefetch={refetch} />
          </div>
        </TabsContent>

        <TabsContent value="history" className="mt-6 focus-visible:outline-none">
          <div className="max-w-3xl">
            <SettingsHistorySection />
          </div>
        </TabsContent>

        <TabsContent value="integrations" className="mt-6 focus-visible:outline-none">
          <div className="max-w-2xl">
            <SettingsIntegrationsSection />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
