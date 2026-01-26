/**
 * TypeScript type definitions for database entities.
 * 
 * This file provides comprehensive type definitions for all database tables,
 * including insert types (for creating records) and select types (for querying records).
 * It also defines enum types for all varchar fields with specific value constraints.
 */

import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import type {
  roles,
  offices,
  teams,
  payPlans,
  commissionRules,
  people,
  personTeams,
  personPayPlans,
  personHistory,
  orgSnapshots,
  recruits,
  recruitHistory,
  deals,
  commissions,
  commissionHistory,
  activityLog,
} from '../lib/db/schema';

// =====================
// ENUM TYPES
// =====================

/**
 * Setter tier classification for commission calculations.
 * Affects override rates and commission rules matching.
 */
export type SetterTier = 'Rookie' | 'Veteran' | 'Team Lead';

/**
 * Person status values.
 */
export type PersonStatus = 'onboarding' | 'active' | 'inactive' | 'terminated';

/**
 * Deal type values.
 */
export type DealType = 'solar' | 'hvac' | 'roofing';

/**
 * Deal status values.
 */
export type DealStatus = 'sold' | 'pending' | 'permitted' | 'scheduled' | 'installed' | 'pto' | 'complete' | 'cancelled';

/**
 * Commission type values.
 * Includes base commissions and override types for different hierarchy levels.
 */
export type CommissionType =
  | 'setter'
  | 'closer'
  | 'self_gen'
  | 'override_reports_to_l1'
  | 'override_reports_to_l2'
  | 'override_reports_to_l3'
  | 'override_recruited_by_l1'
  | 'override_recruited_by_l2'
  | 'override_recruited_by_l3'
  | 'recruiting_bonus'
  | 'draw';

/**
 * Commission status values.
 */
export type CommissionStatus = 'pending' | 'approved' | 'paid' | 'held' | 'void';

/**
 * Commission rule type values.
 */
export type RuleType =
  | 'base_commission'
  | 'setter_commission'
  | 'closer_commission'
  | 'self_gen_commission'
  | 'override'
  | 'recruiting_bonus'
  | 'draw';

/**
 * Commission calculation method values.
 */
export type CalcMethod = 'flat_per_kw' | 'percentage_of_deal' | 'flat_fee';

/**
 * Recruit status values.
 */
export type RecruitStatus =
  | 'lead'
  | 'contacted'
  | 'interviewing'
  | 'offer_sent'
  | 'agreement_sent'
  | 'agreement_signed'
  | 'onboarding'
  | 'converted'
  | 'rejected'
  | 'dropped';

/**
 * Person history change type values.
 */
export type PersonHistoryChangeType =
  | 'role_change'
  | 'status_change'
  | 'office_change'
  | 'reports_to_change'
  | 'pay_plan_change'
  | 'team_join'
  | 'team_leave'
  | 'hired'
  | 'terminated'
  | 'setter_tier_change';

/**
 * Activity log entity type values.
 */
export type ActivityEntityType = 'person' | 'deal' | 'commission' | 'recruit' | 'office' | 'team' | 'pay_plan' | 'role';

/**
 * Activity log action values.
 */
export type ActivityAction =
  | 'created'
  | 'updated'
  | 'deleted'
  | 'status_changed'
  | 'commission_calculated'
  | 'approved'
  | 'rejected'
  | 'paid';

/**
 * Activity log actor type values.
 */
export type ActorType = 'user' | 'system' | 'webhook';

// =====================
// TABLE TYPES (Select - for querying)
// =====================

export type Role = InferSelectModel<typeof roles>;
export type Office = InferSelectModel<typeof offices>;
export type Team = InferSelectModel<typeof teams>;
export type PayPlan = InferSelectModel<typeof payPlans>;
export type CommissionRule = InferSelectModel<typeof commissionRules>;
export type Person = InferSelectModel<typeof people>;
export type PersonTeam = InferSelectModel<typeof personTeams>;
export type PersonPayPlan = InferSelectModel<typeof personPayPlans>;
export type PersonHistory = InferSelectModel<typeof personHistory>;
export type OrgSnapshot = InferSelectModel<typeof orgSnapshots>;
export type Recruit = InferSelectModel<typeof recruits>;
export type RecruitHistory = InferSelectModel<typeof recruitHistory>;
export type Deal = InferSelectModel<typeof deals>;
export type Commission = InferSelectModel<typeof commissions>;
export type CommissionHistory = InferSelectModel<typeof commissionHistory>;
export type ActivityLog = InferSelectModel<typeof activityLog>;

// =====================
// INSERT TYPES (for creating records)
// =====================

export type NewRole = InferInsertModel<typeof roles>;
export type NewOffice = InferInsertModel<typeof offices>;
export type NewTeam = InferInsertModel<typeof teams>;
export type NewPayPlan = InferInsertModel<typeof payPlans>;
export type NewCommissionRule = InferInsertModel<typeof commissionRules>;
export type NewPerson = InferInsertModel<typeof people>;
export type NewPersonTeam = InferInsertModel<typeof personTeams>;
export type NewPersonPayPlan = InferInsertModel<typeof personPayPlans>;
export type NewPersonHistory = InferInsertModel<typeof personHistory>;
export type NewOrgSnapshot = InferInsertModel<typeof orgSnapshots>;
export type NewRecruit = InferInsertModel<typeof recruits>;
export type NewRecruitHistory = InferInsertModel<typeof recruitHistory>;
export type NewDeal = InferInsertModel<typeof deals>;
export type NewCommission = InferInsertModel<typeof commissions>;
export type NewCommissionHistory = InferInsertModel<typeof commissionHistory>;
export type NewActivityLog = InferInsertModel<typeof activityLog>;
