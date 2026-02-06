import { eq } from 'drizzle-orm';
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
      isActive: true,
      sortOrder: 1,
    },
    {
      name: 'Team Lead',
      level: 2,
      description: 'Team leader with override responsibilities',
      isActive: true,
      sortOrder: 2,
    },
    {
      name: 'Area Director',
      level: 3,
      description: 'Area director with office oversight',
      isActive: true,
      sortOrder: 3,
    },
    {
      name: 'Regional Manager',
      level: 4,
      description: 'Regional manager with multi-area oversight',
      isActive: true,
      sortOrder: 4,
    },
    {
      name: 'Divisional',
      level: 5,
      description: 'Divisional leader with multi-region oversight',
      isActive: true,
      sortOrder: 5,
    },
    {
      name: 'VP',
      level: 6,
      description: 'Vice president with company-wide oversight',
      isActive: true,
      sortOrder: 6,
    },
    {
      name: 'Admin',
      level: 7,
      description: 'System administrator',
      isActive: true,
      sortOrder: 7,
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

const PILOT_ROLE_NAMES = ['Admin', 'Area Director', 'Team Lead', 'Sales Rep'] as const;
const PILOT_ROLE_SPECS: Record<(typeof PILOT_ROLE_NAMES)[number], NewRole> = {
  Admin: {
    name: 'Admin',
    level: 7,
    description: 'System administrator',
    isActive: true,
    sortOrder: 7,
  },
  'Area Director': {
    name: 'Area Director',
    level: 3,
    description: 'Area director with office oversight',
    isActive: true,
    sortOrder: 3,
  },
  'Team Lead': {
    name: 'Team Lead',
    level: 2,
    description: 'Team leader with override responsibilities',
    isActive: true,
    sortOrder: 2,
  },
  'Sales Rep': {
    name: 'Sales Rep',
    level: 1,
    description: 'Entry-level sales representative',
    isActive: true,
    sortOrder: 1,
  },
};

/**
 * Seed pilot-specific data for the production pilot program.
 * Creates the four required roles (if missing), one pilot office, and optionally pay plans.
 * Run this separately from seedDatabase() for production pilot setup.
 *
 * @param officeName - Display name for the pilot office
 * @param officeRegion - Region label (e.g. "West", "Midwest")
 * @param officeStates - Array of state codes (e.g. ["Utah"])
 * @param officeAddress - Full address string for the pilot office
 * @param includePilotPayPlans - If true, seeds Standard Setter Plan, Standard Closer Plan, Team Lead Plan when missing
 * @returns Object with pilotOfficeId, roleIds map (role name -> uuid), and optionally payPlanIds
 *
 * @example
 * const { pilotOfficeId, roleIds } = await seedPilotData(
 *   'Pilot Office',
 *   'West',
 *   ['Utah'],
 *   '123 Main St, City, UT 84101',
 *   true
 * );
 */
export async function seedPilotData(
  officeName: string,
  officeRegion: string,
  officeStates: string[],
  officeAddress: string,
  includePilotPayPlans: boolean = false
): Promise<{
  pilotOfficeId: string;
  roleIds: Record<(typeof PILOT_ROLE_NAMES)[number], string>;
  payPlanIds?: Record<string, string>;
}> {
  console.log('Seeding pilot data...');

  const roleIds: Record<(typeof PILOT_ROLE_NAMES)[number], string> = {} as Record<
    (typeof PILOT_ROLE_NAMES)[number],
    string
  >;

  for (const roleName of PILOT_ROLE_NAMES) {
    try {
      const existing = await db.select({ id: roles.id }).from(roles).where(eq(roles.name, roleName)).limit(1);
      if (existing[0]) {
        roleIds[roleName] = existing[0].id;
        console.log(`Role "${roleName}" already exists (${existing[0].id})`);
      } else {
        const spec = PILOT_ROLE_SPECS[roleName];
        const inserted = await db.insert(roles).values(spec).returning();
        if (inserted[0]) {
          roleIds[roleName] = inserted[0].id;
          console.log(`Inserted role "${roleName}" (${inserted[0].id})`);
        } else {
          throw new Error(`Failed to insert role "${roleName}"`);
        }
      }
    } catch (err) {
      console.error(`Error seeding role "${roleName}":`, err);
      throw err;
    }
  }

  let pilotOfficeId: string;
  try {
    const existingOffice = await db
      .select({ id: offices.id })
      .from(offices)
      .where(eq(offices.name, officeName))
      .limit(1);

    if (existingOffice[0]) {
      pilotOfficeId = existingOffice[0].id;
      console.log(`Pilot office "${officeName}" already exists (${pilotOfficeId}), skipping insert`);
    } else {
      const newOffice: NewOffice = {
        name: officeName,
        region: officeRegion,
        states: officeStates,
        address: officeAddress,
        isActive: true,
      };
      const insertedOffices = await db.insert(offices).values(newOffice).returning();
      if (!insertedOffices[0]) throw new Error('Failed to insert pilot office');
      pilotOfficeId = insertedOffices[0].id;
      console.log(`Inserted pilot office "${officeName}" (${pilotOfficeId})`);
    }
  } catch (err) {
    console.error('Error seeding pilot office:', err);
    throw err;
  }

  let payPlanIds: Record<string, string> | undefined;
  if (includePilotPayPlans) {
    const planNames = ['Standard Setter Plan', 'Standard Closer Plan', 'Team Lead Plan'];
    const planSpecs: NewPayPlan[] = [
      { name: 'Standard Setter Plan', description: 'Standard commission plan for setters', isActive: true },
      { name: 'Standard Closer Plan', description: 'Standard commission plan for closers', isActive: true },
      { name: 'Team Lead Plan', description: 'Commission plan for team leads with overrides', isActive: true },
    ];
    payPlanIds = {};
    for (let i = 0; i < planNames.length; i++) {
      const name = planNames[i];
      try {
        const existing = await db.select({ id: payPlans.id }).from(payPlans).where(eq(payPlans.name, name)).limit(1);
        if (existing[0]) {
          payPlanIds[name] = existing[0].id;
          console.log(`Pay plan "${name}" already exists (${existing[0].id})`);
        } else {
          const inserted = await db.insert(payPlans).values(planSpecs[i]).returning();
          if (inserted[0]) {
            payPlanIds[name] = inserted[0].id;
            console.log(`Inserted pay plan "${name}" (${inserted[0].id})`);
          }
        }
      } catch (err) {
        console.error(`Error seeding pay plan "${name}":`, err);
        throw err;
      }
    }
  }

  console.log('Pilot data seeding completed successfully');
  return { pilotOfficeId, roleIds, payPlanIds };
}
