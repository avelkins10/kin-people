"use client";

import React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSettingsData } from "@/hooks/use-settings-data";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { SettingsOverview } from "@/components/settings/settings-overview";
import { SettingsRolesSection } from "@/components/settings/SettingsRolesSection";
import { SettingsOrgStructureSection } from "@/components/settings/SettingsOrgStructureSection";
import { SettingsPayPlansSection } from "@/components/settings/SettingsPayPlansSection";
import { SettingsCommissionRulesSection } from "@/components/settings/SettingsCommissionRulesSection";
import { SettingsDocumentTemplatesSection } from "@/components/settings/SettingsDocumentTemplatesSection";
import { SettingsOnboardingMetricsSection } from "@/components/settings/SettingsOnboardingMetricsSection";
import { SettingsOnboardingTasksSection } from "@/components/settings/SettingsOnboardingTasksSection";
import { SettingsOnboardingFieldsSection } from "@/components/settings/SettingsOnboardingFieldsSection";
import { SettingsEmailTemplatesSection } from "@/components/settings/SettingsEmailTemplatesSection";
import { SettingsHistorySection } from "@/components/settings/SettingsHistorySection";
import { SettingsUsersSection } from "@/components/settings/SettingsUsersSection";
import { SettingsIntegrationsSection } from "@/components/settings/SettingsIntegrationsSection";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  LayoutDashboard,
  Users,
  Shield,
  Network,
  FileText,
  DollarSign,
  Percent,
  GraduationCap,
  History,
  Plug,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

const TAB_VALUES = [
  "overview",
  "users",
  "roles",
  "org-structure",
  "documents",
  "pay-plans",
  "commission-rules",
  "onboarding",
  "history",
  "integrations",
] as const;

type TabValue = (typeof TAB_VALUES)[number];

// Tab groupings for the navigation
const PEOPLE_TABS: TabValue[] = ["users", "roles"];
const COMPENSATION_TABS: TabValue[] = ["pay-plans", "commission-rules"];
const SYSTEM_TABS: TabValue[] = ["history", "integrations"];

const TAB_CONFIG: Record<TabValue, { label: string; icon: typeof LayoutDashboard }> = {
  overview: { label: "Overview", icon: LayoutDashboard },
  users: { label: "Users", icon: Users },
  roles: { label: "Roles", icon: Shield },
  "org-structure": { label: "Org Structure", icon: Network },
  documents: { label: "Documents", icon: FileText },
  "pay-plans": { label: "Pay Plans", icon: DollarSign },
  "commission-rules": { label: "Commission", icon: Percent },
  onboarding: { label: "Onboarding", icon: GraduationCap },
  history: { label: "History", icon: History },
  integrations: { label: "Integrations", icon: Plug },
};

interface TabButtonProps {
  value: TabValue;
  activeTab: string;
  onClick: (value: string) => void;
}

function TabButton({ value, activeTab, onClick }: TabButtonProps) {
  const config = TAB_CONFIG[value];
  const Icon = config.icon;
  const isActive = activeTab === value;

  return (
    <button
      onClick={() => onClick(value)}
      className={cn(
        "relative flex items-center gap-2.5 px-4 py-3.5 text-sm font-semibold transition-all duration-200",
        "whitespace-nowrap rounded-t-md",
        isActive
          ? "text-gray-900 bg-white shadow-sm"
          : "text-gray-500 hover:text-gray-800 hover:bg-gray-50/80"
      )}
    >
      <Icon className={cn(
        "h-4 w-4 shrink-0 transition-colors duration-200",
        isActive ? "text-emerald-600" : "text-gray-400 group-hover:text-gray-500"
      )} />
      <span className="tracking-tight">{config.label}</span>
      {isActive && (
        <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-emerald-500 rounded-full" />
      )}
    </button>
  );
}

interface TabDropdownProps {
  label: string;
  icon: typeof LayoutDashboard;
  tabs: TabValue[];
  activeTab: string;
  onClick: (value: string) => void;
}

function TabDropdown({ label, icon: Icon, tabs, activeTab, onClick }: TabDropdownProps) {
  const isGroupActive = tabs.includes(activeTab as TabValue);
  const activeTabConfig = isGroupActive ? TAB_CONFIG[activeTab as TabValue] : null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            "relative flex items-center gap-2 px-4 py-3.5 text-sm font-semibold transition-all duration-200",
            "whitespace-nowrap rounded-t-md group",
            isGroupActive
              ? "text-gray-900 bg-white shadow-sm"
              : "text-gray-500 hover:text-gray-800 hover:bg-gray-50/80"
          )}
        >
          <Icon className={cn(
            "h-4 w-4 shrink-0 transition-colors duration-200",
            isGroupActive ? "text-emerald-600" : "text-gray-400 group-hover:text-gray-500"
          )} />
          <span className="tracking-tight">{isGroupActive ? activeTabConfig?.label : label}</span>
          <ChevronDown className={cn(
            "h-3 w-3 shrink-0 transition-all duration-200",
            isGroupActive ? "text-emerald-600" : "text-gray-400 group-hover:text-gray-500"
          )} />
          {isGroupActive && (
            <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-emerald-500 rounded-full" />
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="min-w-[180px] p-1.5 bg-white/95 backdrop-blur-sm border-gray-200/80 shadow-lg rounded-lg"
      >
        {tabs.map((tab) => {
          const config = TAB_CONFIG[tab];
          const TabIcon = config.icon;
          const isSelected = activeTab === tab;
          return (
            <DropdownMenuItem
              key={tab}
              onClick={() => onClick(tab)}
              className={cn(
                "flex items-center gap-2.5 cursor-pointer px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-150",
                isSelected
                  ? "bg-emerald-50 text-emerald-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <TabIcon className={cn(
                "h-4 w-4",
                isSelected ? "text-emerald-600" : "text-gray-400"
              )} />
              <span>{config.label}</span>
              {isSelected && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-500" />
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function NavDivider() {
  return <div className="h-5 w-px bg-gray-200/70 mx-0.5 self-center shrink-0" />;
}

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
  const divisions = Array.isArray(data.divisions) ? data.divisions : [];
  const regions = Array.isArray(data.regions) ? data.regions : [];
  const offices = Array.isArray(data.offices) ? data.offices : [];
  const teams = Array.isArray(data.teams) ? data.teams : [];
  const leadership = Array.isArray(data.leadership) ? data.leadership : [];
  const payPlans = Array.isArray(data.payPlans) ? data.payPlans : [];
  const commissionRules = Array.isArray(data.commissionRules) ? data.commissionRules : [];
  const documentTemplates = Array.isArray(data.documentTemplates) ? data.documentTemplates : [];
  const people = Array.isArray(data.people) ? data.people : [];
  const activePayPlans = payPlans.filter((p) => p.isActive).length;
  const totalCommissionRules = commissionRules.length;
  const peopleWithPayPlans = payPlans.reduce((sum, p) => sum + (p.peopleCount ?? 0), 0);
  const peopleWithoutPayPlans = Math.max(0, people.length - peopleWithPayPlans);

  return (
    <div className="space-y-0">
      {/* Header with subtle background treatment */}
      <header className="pb-6">
        <div className="flex items-baseline gap-3">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Organization
          </h1>
          <span className="text-sm font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
            Settings
          </span>
        </div>
        <p className="text-sm text-gray-500 mt-2 max-w-2xl leading-relaxed">
          Configure your team structure, compensation plans, and system preferences.
          Changes are saved automatically and apply across the application.
        </p>
      </header>

      {error && (
        <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-100 text-red-700 text-sm flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
          {error}
        </div>
      )}

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        {/* Enhanced Tab Navigation */}
        <div className="relative">
          {/* Background bar */}
          <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-gray-200 via-gray-200 to-transparent" />

          <nav
            className={cn(
              "relative w-full bg-gray-50/50 rounded-t-xl",
              "overflow-x-auto flex items-end gap-0.5 px-1 pt-1",
              "-mx-1"
            )}
          >
            <TabButton value="overview" activeTab={activeTab} onClick={handleTabChange} />

            <NavDivider />

            <TabDropdown
              label="People"
              icon={Users}
              tabs={PEOPLE_TABS}
              activeTab={activeTab}
              onClick={handleTabChange}
            />

            <NavDivider />

            <TabButton value="org-structure" activeTab={activeTab} onClick={handleTabChange} />

            <NavDivider />

            <TabButton value="documents" activeTab={activeTab} onClick={handleTabChange} />

            <NavDivider />

            <TabDropdown
              label="Compensation"
              icon={DollarSign}
              tabs={COMPENSATION_TABS}
              activeTab={activeTab}
              onClick={handleTabChange}
            />

            <NavDivider />

            <TabButton value="onboarding" activeTab={activeTab} onClick={handleTabChange} />

            <NavDivider />

            <TabDropdown
              label="System"
              icon={History}
              tabs={SYSTEM_TABS}
              activeTab={activeTab}
              onClick={handleTabChange}
            />
          </nav>
        </div>

        {/* Content area with refined spacing */}
        <div className="pt-8">
          <TabsContent value="overview" className="mt-0 focus-visible:outline-none animate-in fade-in-0 duration-200">
            <SettingsOverview
              activePayPlans={activePayPlans}
              totalCommissionRules={totalCommissionRules}
              peopleWithoutPayPlans={peopleWithoutPayPlans}
              totalUsers={people.length}
              totalOffices={offices.length}
              onNavigate={handleTabChange}
            />
          </TabsContent>

          <TabsContent value="users" className="mt-0 focus-visible:outline-none animate-in fade-in-0 duration-200">
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

          <TabsContent value="roles" className="mt-0 focus-visible:outline-none animate-in fade-in-0 duration-200">
            <div className="max-w-2xl">
              <SettingsRolesSection
                roles={roles}
                loading={loading}
                onRefetch={refetch}
              />
            </div>
          </TabsContent>

          <TabsContent value="org-structure" className="mt-0 focus-visible:outline-none animate-in fade-in-0 duration-200">
            <SettingsOrgStructureSection
              divisions={divisions}
              regions={regions}
              offices={offices}
              teams={teams}
              leadership={leadership}
              people={people}
              roles={roles}
              loading={loading}
              onRefetch={refetch}
            />
          </TabsContent>

          <TabsContent value="documents" className="mt-0 focus-visible:outline-none animate-in fade-in-0 duration-200">
            <div className="max-w-2xl">
              <SettingsDocumentTemplatesSection
                documentTemplates={documentTemplates}
                loading={loading}
                onRefetch={refetch}
              />
            </div>
          </TabsContent>

          <TabsContent value="pay-plans" className="mt-0 focus-visible:outline-none animate-in fade-in-0 duration-200">
            <div className="max-w-2xl">
              <SettingsPayPlansSection
                payPlans={payPlans}
                loading={loading}
                onRefetch={refetch}
              />
            </div>
          </TabsContent>

          <TabsContent value="commission-rules" className="mt-0 focus-visible:outline-none animate-in fade-in-0 duration-200">
            <div className="max-w-3xl">
              <SettingsCommissionRulesSection
                commissionRules={commissionRules}
                payPlans={payPlans}
                loading={loading}
                onRefetch={refetch}
              />
            </div>
          </TabsContent>

          <TabsContent value="onboarding" className="mt-0 focus-visible:outline-none animate-in fade-in-0 duration-200">
            <div className="max-w-2xl space-y-6">
              <SettingsOnboardingTasksSection onRefetch={refetch} />
              <SettingsOnboardingFieldsSection onRefetch={refetch} />
              <SettingsEmailTemplatesSection onRefetch={refetch} />
              <SettingsOnboardingMetricsSection onRefetch={refetch} />
            </div>
          </TabsContent>

          <TabsContent value="history" className="mt-0 focus-visible:outline-none animate-in fade-in-0 duration-200">
            <div className="max-w-3xl">
              <SettingsHistorySection />
            </div>
          </TabsContent>

          <TabsContent value="integrations" className="mt-0 focus-visible:outline-none animate-in fade-in-0 duration-200">
            <div className="max-w-2xl">
              <SettingsIntegrationsSection />
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
