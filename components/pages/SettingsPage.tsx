"use client";

import React from "react";
import { useSettingsData } from "@/hooks/use-settings-data";
import { SettingsRolesSection } from "@/components/settings/SettingsRolesSection";
import { SettingsOfficesSection } from "@/components/settings/SettingsOfficesSection";
import { SettingsTeamsSection } from "@/components/settings/SettingsTeamsSection";
import { SettingsPayPlansSection } from "@/components/settings/SettingsPayPlansSection";
import { SettingsCommissionRulesSection } from "@/components/settings/SettingsCommissionRulesSection";
import { SettingsOnboardingMetricsSection } from "@/components/settings/SettingsOnboardingMetricsSection";
import { SettingsHistorySection } from "@/components/settings/SettingsHistorySection";
import { SettingsUsersSection } from "@/components/settings/SettingsUsersSection";

export function SettingsPage() {
  const { data, loading, error, refetch } = useSettingsData();

  return (
    <>
      <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 shrink-0">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tighter text-black mb-1 uppercase">
            Organization
          </h1>
          <p className="text-gray-500 font-medium">
            Configure roles, offices, teams, users, and compensation plans.
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Changes here are saved to the database and apply across the app (people, org chart, recruiting, deals, etc.).
          </p>
        </div>
      </header>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-sm text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
        <SettingsUsersSection
          people={data.people}
          roles={data.roles}
          offices={data.offices}
          loading={loading}
          onRefetch={refetch}
        />
        <SettingsRolesSection
          roles={data.roles}
          loading={loading}
          onRefetch={refetch}
        />
        <SettingsOfficesSection
          offices={data.offices}
          loading={loading}
          onRefetch={refetch}
        />
        <SettingsTeamsSection
          teams={data.teams}
          offices={data.offices}
          loading={loading}
          onRefetch={refetch}
        />
        <SettingsPayPlansSection
          payPlans={data.payPlans}
          loading={loading}
          onRefetch={refetch}
        />
      </div>

      <div className="mt-8">
        <SettingsCommissionRulesSection
          commissionRules={data.commissionRules}
          payPlans={data.payPlans}
          loading={loading}
          onRefetch={refetch}
        />
      </div>

      <div className="mt-8">
        <SettingsOnboardingMetricsSection onRefetch={refetch} />
      </div>

      <div className="mt-8">
        <SettingsHistorySection />
      </div>
    </>
  );
}
