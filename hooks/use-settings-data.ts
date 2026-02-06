"use client";

import { useState, useEffect, useCallback } from "react";

export interface Role {
  id: string;
  name: string;
  level: number;
  description: string | null;
  isActive: boolean;
  sortOrder: number;
  permissions?: string[] | unknown;
  createdAt?: string;
  updatedAt?: string;
}

export interface Division {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface Region {
  id: string;
  name: string;
  description: string | null;
  divisionId: string | null;
  isActive: boolean | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface Office {
  id: string;
  name: string;
  region: string | null;
  regionId: string | null;
  division: string | null;
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

export interface LeadershipAssignment {
  id: string;
  officeId: string | null;
  region: string | null;
  regionId: string | null;
  division: string | null;
  roleType: string;
  personId: string;
  personName: string | null;
  effectiveFrom: string;
  effectiveTo: string | null;
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

export interface DocumentTemplate {
  id: string;
  documentType: string;
  displayName: string;
  signnowTemplateId: string | null;
  requireRecruit: boolean | null;
  requireManager: boolean | null;
  requireHR: boolean | null;
  expirationDays: number | null;
  reminderFrequencyDays: number | null;
  description: string | null;
  metadata: unknown;
  isActive: boolean | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface PersonListItem {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  status: string | null;
  hireDate: string | null;
  officeId: string | null;
  officeName: string | null;
  roleName: string;
  setterTier: string | null;
  name: string;
  managerName: string | null;
}

interface SettingsData {
  roles: Role[];
  divisions: Division[];
  regions: Region[];
  offices: Office[];
  teams: Team[];
  leadership: LeadershipAssignment[];
  payPlans: PayPlan[];
  commissionRules: CommissionRule[];
  documentTemplates: DocumentTemplate[];
  people: PersonListItem[];
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error || res.statusText);
  }
  return res.json();
}

function toArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? value : [];
}

export function useSettingsData() {
  const [data, setData] = useState<SettingsData>({
    roles: [],
    divisions: [],
    regions: [],
    offices: [],
    teams: [],
    leadership: [],
    payPlans: [],
    commissionRules: [],
    documentTemplates: [],
    people: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [rolesRaw, divisionsRaw, regionsRaw, officesRaw, teamsRaw, leadershipRaw, payPlansRaw, commissionRulesRaw, documentTemplatesRaw, peopleRaw] =
        await Promise.all([
          fetchJson("/api/roles"),
          fetchJson("/api/divisions"),
          fetchJson("/api/regions"),
          fetchJson("/api/offices"),
          fetchJson("/api/teams"),
          fetchJson("/api/office-leadership?current=true"),
          fetchJson("/api/pay-plans"),
          fetchJson("/api/commission-rules"),
          fetchJson("/api/document-templates"),
          fetchJson("/api/people"),
        ]);
      setData({
        roles: toArray<Role>(rolesRaw),
        divisions: toArray<Division>(divisionsRaw),
        regions: toArray<Region>(regionsRaw),
        offices: toArray<Office>(officesRaw),
        teams: toArray<Team>(teamsRaw),
        leadership: toArray<LeadershipAssignment>(leadershipRaw),
        payPlans: toArray<PayPlan>(payPlansRaw),
        commissionRules: toArray<CommissionRule>(commissionRulesRaw),
        documentTemplates: toArray<DocumentTemplate>(documentTemplatesRaw),
        people: toArray<PersonListItem>(peopleRaw),
      });
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
