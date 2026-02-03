"use client";

import { useState, useEffect, useCallback } from "react";

export interface Role {
  id: string;
  name: string;
  level: number;
  description: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Office {
  id: string;
  name: string;
  region: string | null;
  address: string | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Team {
  id: string;
  name: string;
  description: string | null;
  officeId: string | null;
  teamLeadId: string | null;
  isActive: boolean;
  officeName?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PayPlan {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  rulesCount?: number;
  peopleCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CommissionRule {
  id: string;
  payPlanId: string;
  name: string | null;
  ruleType: string;
  calcMethod: string;
  amount: string;
  appliesToRoleId: string | null;
  overrideLevel: number | null;
  overrideSource: string | null;
  dealTypes: string[] | null;
  isActive: boolean;
  sortOrder: number;
  payPlanName?: string;
  appliesToRoleName?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface SettingsData {
  roles: Role[];
  offices: Office[];
  teams: Team[];
  payPlans: PayPlan[];
  commissionRules: CommissionRule[];
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error || res.statusText);
  }
  return res.json();
}

export function useSettingsData() {
  const [data, setData] = useState<SettingsData>({
    roles: [],
    offices: [],
    teams: [],
    payPlans: [],
    commissionRules: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [roles, offices, teams, payPlans, commissionRules] = await Promise.all([
        fetchJson<Role[]>("/api/roles"),
        fetchJson<Office[]>("/api/offices"),
        fetchJson<Team[]>("/api/teams"),
        fetchJson<PayPlan[]>("/api/pay-plans"),
        fetchJson<CommissionRule[]>("/api/commission-rules"),
      ]);
      setData({ roles, offices, teams, payPlans, commissionRules });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load settings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, loading, error, refetch };
}
