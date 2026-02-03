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

const PILOT_OFFICE_NAME = 'Pilot Office';

async function verifyPilotUsers() {
  const supabase = createAdminSupabaseClient();
  let hasCriticalIssues = false;

  try {
    const [officeRow] = await db
      .select({ id: offices.id })
      .from(offices)
      .where(eq(offices.name, PILOT_OFFICE_NAME))
      .limit(1);

    if (!officeRow) {
      console.error(`Pilot office "${PILOT_OFFICE_NAME}" not found.`);
      process.exit(1);
    }

    const pilotOfficeId = officeRow.id;

    const pilotPeople = await db
      .select({
        id: people.id,
        email: people.email,
        firstName: people.firstName,
        lastName: people.lastName,
        roleId: people.roleId,
        officeId: people.officeId,
        authUserId: people.authUserId,
        reportsToId: people.reportsToId,
        recruitedById: people.recruitedById,
      })
      .from(people)
      .where(eq(people.officeId, pilotOfficeId));

    const roleRows = await db.select({ id: roles.id, name: roles.name }).from(roles);
    const roleNameById: Record<string, string> = {};
    for (const r of roleRows) {
      roleNameById[r.id] = r.name;
    }

    const personById = new Map(pilotPeople.map((p) => [p.id, p]));
    const emailById = new Map(pilotPeople.map((p) => [p.id, p.email]));

    console.log('\n--- Pilot user verification ---\n');
    console.log(
      'Email                    | Role           | Office  | Manager Email      | Recruiter Email   | Auth'
    );
    console.log('-'.repeat(100));

    for (const person of pilotPeople) {
      const roleName = roleNameById[person.roleId] ?? '?';
      const officeOk = person.officeId === pilotOfficeId;
      const managerEmail = person.reportsToId ? emailById.get(person.reportsToId) ?? 'INVALID' : '-';
      const recruiterEmail = person.recruitedById
        ? emailById.get(person.recruitedById) ?? 'INVALID'
        : '-';

      let authStatus = '?';
      if (!person.authUserId) {
        authStatus = 'MISSING';
        hasCriticalIssues = true;
      } else {
        const { data: authUser, error } = await supabase.auth.admin.getUserById(person.authUserId);
        if (error) {
          authStatus = 'ERROR';
          hasCriticalIssues = true;
        } else if (!authUser?.user) {
          authStatus = 'NOT FOUND';
          hasCriticalIssues = true;
        } else {
          authStatus = 'OK';
        }
      }

      const reportsToValid =
        !person.reportsToId || personById.has(person.reportsToId);
      const recruitedByValid =
        !person.recruitedById || personById.has(person.recruitedById);
      if (!reportsToValid || !recruitedByValid) hasCriticalIssues = true;

      const emailPad = person.email.padEnd(24);
      const rolePad = roleName.padEnd(14);
      const officePad = officeOk ? 'OK' : 'WRONG';
      const managerPad = (managerEmail === 'INVALID' ? managerEmail : managerEmail).padEnd(19);
      const recruiterPad = (recruiterEmail === 'INVALID' ? recruiterEmail : recruiterEmail).padEnd(
        18
      );

      console.log(
        `${emailPad} | ${rolePad} | ${officePad.padEnd(6)} | ${managerPad} | ${recruiterPad} | ${authStatus}`
      );
    }

    console.log('-'.repeat(100));
    console.log(
      '\nIssues: ' +
        (hasCriticalIssues
          ? 'One or more critical issues (missing authUserId, invalid relationships, or auth user not found).'
          : 'None.')
    );
  } finally {
    await pgClient.end();
  }

  if (hasCriticalIssues) {
    process.exit(1);
  }
}

verifyPilotUsers()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
