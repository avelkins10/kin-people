import type { Recruit } from "@/lib/db/schema/recruits";
import type { RecruitHistory } from "@/lib/db/schema/recruit-history";

export interface RecruitWithDetails {
  recruit: Recruit;
  recruiter: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  targetOffice: {
    id: string;
    name: string;
  } | null;
  targetTeam: {
    id: string;
    name: string;
  } | null;
  targetReportsTo: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  targetRole: {
    id: string;
    name: string;
  } | null;
  targetPayPlan: {
    id: string;
    name: string;
  } | null;
}

export interface RecruitHistoryWithChanger {
  history: RecruitHistory;
  changedBy: {
    firstName: string;
    lastName: string;
  } | null;
}

export type RecruitStatus =
  | "lead"
  | "contacted"
  | "interviewing"
  | "offer_sent"
  | "agreement_sent"
  | "agreement_signed"
  | "onboarding"
  | "converted"
  | "rejected"
  | "dropped";

export type RecruitPriority = "high" | "medium" | "low" | null;

export interface RecruitListItem {
  recruit: Recruit;
  recruiter: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  targetOffice: {
    id: string;
    name: string;
  } | null;
  targetRole: {
    id: string;
    name: string;
  } | null;
}
