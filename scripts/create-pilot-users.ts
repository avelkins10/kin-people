import dotenv from 'dotenv';
dotenv.config();
dotenv.config({ path: '.env.local', override: true });

import { createClient } from '@supabase/supabase-js';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { eq } from 'drizzle-orm';
import { people, roles, offices } from '../lib/db/schema';
import { schema } from '../lib/db/schema';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

const pgClient = postgres(process.env.DATABASE_URL, { ssl: 'require' });
const db = drizzle(pgClient, { schema });

function createAdminSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      'Supabase admin client requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY'
    );
  }

  return createClient(url, serviceRoleKey);
}

/** Pilot office name used to look up office ID (must match name used in seedPilotData). */
const PILOT_OFFICE_NAME = 'Pilot Office';

type PilotRoleName = 'Office Manager' | 'Team Lead' | 'Sales Rep';

type SupabaseAdminClient = ReturnType<typeof createAdminSupabaseClient>;

/**
 * Get or create a Supabase Auth user by email. If the user already exists (e.g. from a previous run),
 * fetches and returns their id instead of erroring. Replicates email-based linking consistent with
 * /api/auth/sync-user behavior.
 */
async function getOrCreateAuthUserId(
  supabase: SupabaseAdminClient,
  email: string,
  password: string
): Promise<string> {
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (!authError) {
    const id = authData.user?.id;
    if (id) return id;
    throw new Error(`createUser for ${email} returned no user id`);
  }

  const msg = authError.message.toLowerCase();
  const isAlreadyRegistered =
    msg.includes('already') || msg.includes('registered') || msg.includes('already been');
  if (!isAlreadyRegistered) {
    throw new Error(`Auth create failed for ${email}: ${authError.message}`);
  }

  const { data: listData, error: listError } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  if (listError) throw new Error(`listUsers failed: ${listError.message}`);
  const found = listData?.users?.find((u) => u.email?.toLowerCase() === email.toLowerCase());
  if (!found?.id) throw new Error(`Auth user with email ${email} not found after listUsers`);
  return found.id;
}

interface PilotUserConfig {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  roleName: PilotRoleName;
  phone?: string;
  hireDate: string;
  setterTier?: 'Rookie' | 'Veteran' | 'Team Lead';
  reportsToEmail?: string;
  recruitedByEmail?: string;
}

/**
 * Configure pilot users here. Run seedPilotData first so the pilot office and roles exist.
 */
const PILOT_USERS: PilotUserConfig[] = [
  {
    email: 'office.manager@example.com',
    password: 'ChangeMe123!',
    firstName: 'Office',
    lastName: 'Manager',
    roleName: 'Office Manager',
    phone: '+15550100001',
    hireDate: '2025-01-01',
  },
  {
    email: 'team.lead@example.com',
    password: 'ChangeMe123!',
    firstName: 'Team',
    lastName: 'Lead',
    roleName: 'Team Lead',
    phone: '+15550100002',
    hireDate: '2025-01-01',
    reportsToEmail: 'office.manager@example.com',
  },
  {
    email: 'sales.rep1@example.com',
    password: 'ChangeMe123!',
    firstName: 'Sales',
    lastName: 'Rep1',
    roleName: 'Sales Rep',
    phone: '+15550100003',
    hireDate: '2025-01-15',
    setterTier: 'Rookie',
    reportsToEmail: 'team.lead@example.com',
    recruitedByEmail: 'team.lead@example.com',
  },
  {
    email: 'sales.rep2@example.com',
    password: 'ChangeMe123!',
    firstName: 'Sales',
    lastName: 'Rep2',
    roleName: 'Sales Rep',
    phone: '+15550100004',
    hireDate: '2025-01-15',
    setterTier: 'Veteran',
    reportsToEmail: 'team.lead@example.com',
  },
  {
    email: 'sales.rep3@example.com',
    password: 'ChangeMe123!',
    firstName: 'Sales',
    lastName: 'Rep3',
    roleName: 'Sales Rep',
    phone: '+15550100005',
    hireDate: '2025-02-01',
    setterTier: 'Rookie',
    reportsToEmail: 'team.lead@example.com',
    recruitedByEmail: 'sales.rep2@example.com',
  },
];

async function createPilotUsers() {
  const supabase = createAdminSupabaseClient();

  try {
  const [officeRow] = await db
    .select({ id: offices.id })
    .from(offices)
    .where(eq(offices.name, PILOT_OFFICE_NAME))
    .limit(1);

  if (!officeRow) {
    throw new Error(
      `Pilot office "${PILOT_OFFICE_NAME}" not found. Run seedPilotData first to create the pilot office.`
    );
  }

  const pilotOfficeId = officeRow.id;

  const roleRows = await db.select({ id: roles.id, name: roles.name }).from(roles);
  const roleIdsByName: Record<string, string> = {};
  for (const r of roleRows) {
    roleIdsByName[r.name] = r.id;
  }

  const requiredRoles: PilotRoleName[] = ['Office Manager', 'Team Lead', 'Sales Rep'];
  for (const name of requiredRoles) {
    if (!roleIdsByName[name]) {
      throw new Error(`Role "${name}" not found. Run seedPilotData first to create roles.`);
    }
  }

  const emailToPersonId: Record<string, string> = {};

  for (const user of PILOT_USERS) {
    try {
      const roleId = roleIdsByName[user.roleName];
      if (!roleId) {
        console.error(`Skipping ${user.email}: role "${user.roleName}" not found`);
        continue;
      }

      const existingPerson = await db
        .select({ id: people.id, authUserId: people.authUserId })
        .from(people)
        .where(eq(people.email, user.email))
        .limit(1);

      if (existingPerson[0]) {
        const person = existingPerson[0];
        const authUserId = await getOrCreateAuthUserId(supabase, user.email, user.password);
        await db.update(people).set({ authUserId }).where(eq(people.id, person.id));
        emailToPersonId[user.email] = person.id;
        console.log(`Reconciled: ${user.email} (${user.roleName}) -> person ${person.id} linked to auth`);
        continue;
      }

      const authUserId = await getOrCreateAuthUserId(supabase, user.email, user.password);

      try {
        const [inserted] = await db
          .insert(people)
          .values({
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            phone: user.phone ?? null,
            roleId,
            authUserId,
            officeId: pilotOfficeId,
            status: 'active',
            hireDate: user.hireDate,
            setterTier: user.setterTier ?? null,
          })
          .returning({ id: people.id });

        if (inserted) {
          emailToPersonId[user.email] = inserted.id;
          console.log(`Created: ${user.email} (${user.roleName}) -> person ${inserted.id}`);
        }
      } catch (personErr) {
        await supabase.auth.admin.deleteUser(authUserId);
        console.error(
          `Person insert failed for ${user.email}; deleted auth user to avoid orphan:`,
          personErr
        );
      }
    } catch (err) {
      console.error(`Error creating user ${user.email}:`, err);
    }
  }

  for (const user of PILOT_USERS) {
    const personId = emailToPersonId[user.email];
    if (!personId) continue;

    const updates: { reportsToId?: string; recruitedById?: string } = {};

    if (user.reportsToEmail) {
      const reportsToId = emailToPersonId[user.reportsToEmail];
      if (reportsToId) updates.reportsToId = reportsToId;
    }
    if (user.recruitedByEmail) {
      const recruitedById = emailToPersonId[user.recruitedByEmail];
      if (recruitedById) updates.recruitedById = recruitedById;
    }

    if (Object.keys(updates).length > 0) {
      try {
        await db.update(people).set(updates).where(eq(people.id, personId));
        if (updates.reportsToId) console.log(`Linked reportsTo: ${user.email} -> ${user.reportsToEmail}`);
        if (updates.recruitedById) console.log(`Linked recruitedBy: ${user.email} -> ${user.recruitedByEmail}`);
      } catch (err) {
        console.error(`Error linking relationships for ${user.email}:`, err);
      }
    }
  }

  console.log('Pilot user creation finished.');
  } finally {
    await pgClient.end();
  }
}

createPilotUsers()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
