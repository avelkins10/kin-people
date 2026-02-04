"use client";

import React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSettingsData } from "@/hooks/use-settings-data";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { SettingsOverview } from "@/components/settings/settings-overview";
import { SettingsRolesSection } from "@/components/settings/SettingsRolesSection";
import { SettingsOfficesSection } from "@/components/settings/SettingsOfficesSection";
import { SettingsTeamsSection } from "@/components/settings/SettingsTeamsSection";
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
  MapPin,
  UsersRound,
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
  "offices",
  "teams",
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
const STRUCTURE_TABS: TabValue[] = ["offices", "teams"];
const COMPENSATION_TABS: TabValue[] = ["pay-plans", "commission-rules"];
const SYSTEM_TABS: TabValue[] = ["history", "integrations"];

const TAB_CONFIG: Record<TabValue, { label: string; icon: typeof LayoutDashboard }> = {
  overview: { label: "Overview", icon: LayoutDashboard },
  users: { label: "Users", icon: Users },
  roles: { label: "Roles", icon: Shield },
  offices: { label: "Offices", icon: MapPin },
  teams: { label: "Teams", icon: UsersRound },
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
        "flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors",
        "border-b-2 whitespace-nowrap",
        isActive
          ? "border-black text-black"
          : "border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300"
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {config.label}
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
            "flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors",
            "border-b-2 whitespace-nowrap",
            isGroupActive
              ? "border-black text-black"
              : "border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300"
          )}
        >
          <Icon className="h-4 w-4 shrink-0" />
          {isGroupActive ? activeTabConfig?.label : label}
          <ChevronDown className="h-3 w-3 shrink-0 opacity-60" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[160px]">
        {tabs.map((tab) => {
          const config = TAB_CONFIG[tab];
          const TabIcon = config.icon;
          return (
            <DropdownMenuItem
              key={tab}
              onClick={() => onClick(tab)}
              className={cn(
                "flex items-center gap-2 cursor-pointer",
                activeTab === tab && "bg-indigo-50 text-indigo-700"
              )}
            >
              <TabIcon className="h-4 w-4" />
              {config.label}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function Divider() {
  return <div className="h-6 w-px bg-gray-200 mx-1 self-center shrink-0" />;
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
        {/* Grouped Tab Navigation */}
        <div
          className={cn(
            "w-full border-b border-gray-200 bg-transparent",
            "overflow-x-auto flex items-center gap-0.5"
          )}
        >
          <TabButton value="overview" activeTab={activeTab} onClick={handleTabChange} />

          <Divider />

          <TabDropdown
            label="People"
            icon={Users}
            tabs={PEOPLE_TABS}
            activeTab={activeTab}
            onClick={handleTabChange}
          />

          <Divider />

          <TabDropdown
            label="Structure"
            icon={MapPin}
            tabs={STRUCTURE_TABS}
            activeTab={activeTab}
            onClick={handleTabChange}
          />

          <Divider />

          <TabButton value="documents" activeTab={activeTab} onClick={handleTabChange} />

          <Divider />

          <TabDropdown
            label="Compensation"
            icon={DollarSign}
            tabs={COMPENSATION_TABS}
            activeTab={activeTab}
            onClick={handleTabChange}
          />

          <Divider />

          <TabButton value="onboarding" activeTab={activeTab} onClick={handleTabChange} />

          <Divider />

          <TabDropdown
            label="System"
            icon={History}
            tabs={SYSTEM_TABS}
            activeTab={activeTab}
            onClick={handleTabChange}
          />
        </div>

        <TabsContent value="overview" className="mt-6 focus-visible:outline-none">
          <SettingsOverview
            activePayPlans={activePayPlans}
            totalCommissionRules={totalCommissionRules}
            peopleWithoutPayPlans={peopleWithoutPayPlans}
            totalUsers={people.length}
            totalOffices={offices.length}
            onNavigate={handleTabChange}
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
          <div className="max-w-2xl space-y-6">
            <SettingsOnboardingTasksSection onRefetch={refetch} />
            <SettingsOnboardingFieldsSection onRefetch={refetch} />
            <SettingsEmailTemplatesSection onRefetch={refetch} />
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
