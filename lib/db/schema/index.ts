/**
 * Schema index file - exports all table definitions for Drizzle ORM.
 * 
 * This file centralizes all schema exports for use in:
 * - Database connection (lib/db/index.ts)
 * - Migrations (drizzle.config.ts)
 * - Type inference throughout the application
 * 
 * Schema Structure:
 * - Configuration: roles, offices, teams, pay_plans, commission_rules
 * - People & Org: people, person_teams, person_pay_plans, person_history, org_snapshots
 * - Recruiting: recruits, recruit_history
 * - Deals & Commissions: deals, commissions, commission_history
 * - Audit: activity_log
 */

// Configuration tables
export * from './roles';
export * from './regions';
export * from './offices';
export * from './office-leadership';
export * from './teams';
export * from './pay-plans';
export * from './commission-rules';

// People & Organization tables
export * from './people';
export * from './person-teams';
export * from './person-pay-plans';
export * from './person-history';
export * from './org-snapshots';
export * from './onboarding-tasks';
export * from './person-onboarding-progress';
export * from './onboarding-info-fields';
export * from './person-onboarding-info';

// Recruiting tables
export * from './recruits';
export * from './recruit-history';

// System tables
export * from './kin-id-sequence';

// Document Management tables
export * from './documents';
export * from './document-templates';

// Deals & Commissions tables
export * from './deals';
export * from './commissions';
export * from './commission-history';

// Audit tables
export * from './activity-log';
export * from './app-settings';

// Export schema object for Drizzle migrations
import { roles } from './roles';
import { regions } from './regions';
import { offices } from './offices';
import { officeLeadership } from './office-leadership';
import { teams } from './teams';
import { payPlans } from './pay-plans';
import { commissionRules } from './commission-rules';
import { people } from './people';
import { personTeams } from './person-teams';
import { personPayPlans } from './person-pay-plans';
import { personHistory } from './person-history';
import { orgSnapshots } from './org-snapshots';
import { onboardingTasks } from './onboarding-tasks';
import { personOnboardingProgress } from './person-onboarding-progress';
import { onboardingInfoFields } from './onboarding-info-fields';
import { personOnboardingInfo } from './person-onboarding-info';
import { recruits } from './recruits';
import { recruitHistory } from './recruit-history';
import { documents } from './documents';
import { documentTemplates } from './document-templates';
import { deals } from './deals';
import { commissions } from './commissions';
import { commissionHistory } from './commission-history';
import { activityLog } from './activity-log';
import { appSettings } from './app-settings';
import { kinIdSequence } from './kin-id-sequence';

export const schema = {
  roles,
  regions,
  offices,
  officeLeadership,
  teams,
  payPlans,
  commissionRules,
  people,
  personTeams,
  personPayPlans,
  personHistory,
  orgSnapshots,
  onboardingTasks,
  personOnboardingProgress,
  onboardingInfoFields,
  personOnboardingInfo,
  recruits,
  recruitHistory,
  documents,
  documentTemplates,
  deals,
  commissions,
  commissionHistory,
  activityLog,
  appSettings,
  kinIdSequence,
};
