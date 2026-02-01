import { db } from './index';
import {
  roles,
  offices,
  payPlans,
  commissionRules,
  type NewRole,
  type NewOffice,
  type NewPayPlan,
  type NewCommissionRule,
} from './schema';

/**
 * Seed data for initial database setup.
 * 
 * This file contains seed data for:
 * - Roles (Sales Rep, Team Lead, Area Director, Regional Manager, Admin)
 * - Offices (at least 2 test offices)
 * - Pay Plans (Standard Setter Plan, Standard Closer Plan, Team Lead Plan)
 * - Commission Rules (covering all rule types and setter tiers)
 * 
 * Run this seed function in development to populate initial data.
 */

export async function seedDatabase() {
  console.log('Seeding database...');

  // Seed Roles
  const seedRoles: NewRole[] = [
    {
      name: 'Sales Rep',
      level: 1,
      description: 'Entry-level sales representative',
      permissions: { view_own_data_only: true },
      isActive: true,
      sortOrder: 1,
    },
    {
      name: 'Team Lead',
      level: 2,
      description: 'Team leader with override responsibilities',
      permissions: { manage_own_team: true },
      isActive: true,
      sortOrder: 2,
    },
    {
      name: 'Area Director',
      level: 3,
      description: 'Area director with regional oversight',
      permissions: { manage_own_office: true, approve_commissions: true },
      isActive: true,
      sortOrder: 3,
    },
    {
      name: 'Regional Manager',
      level: 4,
      description: 'Regional manager with multi-area oversight',
      permissions: { manage_own_region: true, view_all_people: true, approve_commissions: true },
      isActive: true,
      sortOrder: 4,
    },
    {
      name: 'Admin',
      level: 5,
      description: 'System administrator',
      permissions: { manage_all: true },
      isActive: true,
      sortOrder: 5,
    },
  ];

  const insertedRoles = await db.insert(roles).values(seedRoles).returning();
  console.log(`Inserted ${insertedRoles.length} roles`);

  // Seed Offices
  const seedOffices: NewOffice[] = [
    {
      name: 'Utah HQ',
      region: 'West',
      states: ['Utah'],
      address: '123 Main St, Salt Lake City, UT 84101',
      isActive: true,
    },
    {
      name: 'Iowa Office',
      region: 'Midwest',
      states: ['Iowa'],
      address: '456 Oak Ave, Des Moines, IA 50309',
      isActive: true,
    },
    {
      name: 'Ohio Office',
      region: 'Midwest',
      states: ['Ohio'],
      address: '789 Elm St, Columbus, OH 43215',
      isActive: true,
    },
    {
      name: 'Florida Office',
      region: 'Southeast',
      states: ['Florida'],
      address: '321 Pine Rd, Miami, FL 33101',
      isActive: true,
    },
  ];

  const insertedOffices = await db.insert(offices).values(seedOffices).returning();
  console.log(`Inserted ${insertedOffices.length} offices`);

  // Seed Pay Plans
  const seedPayPlans: NewPayPlan[] = [
    {
      name: 'Standard Setter Plan',
      description: 'Standard commission plan for setters',
      isActive: true,
    },
    {
      name: 'Standard Closer Plan',
      description: 'Standard commission plan for closers',
      isActive: true,
    },
    {
      name: 'Team Lead Plan',
      description: 'Commission plan for team leads with overrides',
      isActive: true,
    },
  ];

  const insertedPayPlans = await db.insert(payPlans).values(seedPayPlans).returning();
  console.log(`Inserted ${insertedPayPlans.length} pay plans`);

  // Seed Commission Rules
  const setterPlan = insertedPayPlans.find((p) => p.name === 'Standard Setter Plan')!;
  const closerPlan = insertedPayPlans.find((p) => p.name === 'Standard Closer Plan')!;
  const teamLeadPlan = insertedPayPlans.find((p) => p.name === 'Team Lead Plan')!;

  const seedCommissionRules: NewCommissionRule[] = [
    // Setter Plan Rules
    {
      payPlanId: setterPlan.id,
      name: 'Setter Base Commission - Solar',
      ruleType: 'setter_commission',
      calcMethod: 'flat_per_kw',
      amount: '250.0000', // $250 per kW
      dealTypes: ['solar'],
      conditions: {},
      isActive: true,
      sortOrder: 1,
    },
    {
      payPlanId: setterPlan.id,
      name: 'Setter Base Commission - HVAC',
      ruleType: 'setter_commission',
      calcMethod: 'percentage_of_deal',
      amount: '5.0000', // 5% of deal value
      dealTypes: ['hvac'],
      conditions: {},
      isActive: true,
      sortOrder: 2,
    },
    {
      payPlanId: setterPlan.id,
      name: 'Setter Base Commission - Roofing',
      ruleType: 'setter_commission',
      calcMethod: 'percentage_of_deal',
      amount: '3.0000', // 3% of deal value
      dealTypes: ['roofing'],
      conditions: {},
      isActive: true,
      sortOrder: 3,
    },
    // Closer Plan Rules
    {
      payPlanId: closerPlan.id,
      name: 'Closer Base Commission - Solar',
      ruleType: 'closer_commission',
      calcMethod: 'flat_per_kw',
      amount: '300.0000', // $300 per kW
      dealTypes: ['solar'],
      conditions: {},
      isActive: true,
      sortOrder: 1,
    },
    {
      payPlanId: closerPlan.id,
      name: 'Closer Base Commission - HVAC',
      ruleType: 'closer_commission',
      calcMethod: 'percentage_of_deal',
      amount: '7.0000', // 7% of deal value
      dealTypes: ['hvac'],
      conditions: {},
      isActive: true,
      sortOrder: 2,
    },
    // Self-Gen Rules
    {
      payPlanId: setterPlan.id,
      name: 'Self-Gen Bonus - Solar',
      ruleType: 'self_gen_commission',
      calcMethod: 'flat_per_kw',
      amount: '50.0000', // Additional $50 per kW for self-gen
      dealTypes: ['solar'],
      conditions: {},
      isActive: true,
      sortOrder: 10,
    },
    // Team Lead Override Rules
    {
      payPlanId: teamLeadPlan.id,
      name: 'Team Lead Override L1 - Reports To',
      ruleType: 'override',
      calcMethod: 'percentage_of_deal',
      amount: '2.0000', // 2% override
      overrideLevel: 1,
      overrideSource: 'reports_to',
      dealTypes: null, // All deal types
      conditions: {},
      isActive: true,
      sortOrder: 1,
    },
    {
      payPlanId: teamLeadPlan.id,
      name: 'Team Lead Override L1 - Recruited By (Rookie)',
      ruleType: 'override',
      calcMethod: 'percentage_of_deal',
      amount: '1.0000', // 1% override for Rookie setters
      overrideLevel: 1,
      overrideSource: 'recruited_by',
      dealTypes: null,
      conditions: { setter_tier: 'Rookie' },
      isActive: true,
      sortOrder: 2,
    },
    {
      payPlanId: teamLeadPlan.id,
      name: 'Team Lead Override L1 - Recruited By (Veteran)',
      ruleType: 'override',
      calcMethod: 'percentage_of_deal',
      amount: '1.5000', // 1.5% override for Veteran setters
      overrideLevel: 1,
      overrideSource: 'recruited_by',
      dealTypes: null,
      conditions: { setter_tier: 'Veteran' },
      isActive: true,
      sortOrder: 3,
    },
    {
      payPlanId: teamLeadPlan.id,
      name: 'Team Lead Override L1 - Recruited By (Team Lead)',
      ruleType: 'override',
      calcMethod: 'percentage_of_deal',
      amount: '2.0000', // 2% override for Team Lead setters
      overrideLevel: 1,
      overrideSource: 'recruited_by',
      dealTypes: null,
      conditions: { setter_tier: 'Team Lead' },
      isActive: true,
      sortOrder: 4,
    },
  ];

  const insertedRules = await db.insert(commissionRules).values(seedCommissionRules).returning();
  console.log(`Inserted ${insertedRules.length} commission rules`);

  console.log('Database seeding completed successfully');
  return {
    roles: insertedRoles,
    offices: insertedOffices,
    payPlans: insertedPayPlans,
    commissionRules: insertedRules,
  };
}
