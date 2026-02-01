import type { Person, Role, Office, Team, PayPlan, PersonHistory } from "@/lib/db/schema";

/**
 * Person with all related details for display
 */
export interface PersonWithDetails {
  person: Person;
  role: Role | null;
  office: Office | null;
  manager: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  recruiter: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  currentTeams: Array<{
    team: Team;
    roleInTeam: string;
    effectiveDate: Date | null;
  }>;
  currentPayPlan: {
    payPlan: PayPlan;
    effectiveDate: Date | null;
    notes: string | null;
  } | null;
}

/**
 * Person history record with changer information
 */
export interface PersonHistoryWithChanger {
  history: PersonHistory;
  changedBy: {
    firstName: string;
    lastName: string;
  } | null;
}

/**
 * Request types for API endpoints
 */
export interface ChangeRoleRequest {
  newRoleId: string;
  effectiveDate: string;
  reason: string;
  updatePayPlan?: boolean;
  newPayPlanId?: string;
}

export interface ChangeOfficeRequest {
  newOfficeId: string;
  effectiveDate: string;
  reason: string;
}

export interface ChangeManagerRequest {
  newManagerId: string | null;
  effectiveDate: string;
  reason: string;
}

export interface ChangePayPlanRequest {
  newPayPlanId: string;
  effectiveDate: string;
  reason: string;
  notes?: string;
}

export interface AddToTeamRequest {
  teamId: string;
  roleInTeam: string;
  effectiveDate: string;
}

export interface TerminateRequest {
  terminationDate: string;
  reason: string;
}
