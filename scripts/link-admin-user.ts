/**
 * Link an existing Supabase Auth user to a person record with Admin role.
 * Use when auth works but getCurrentUser() returns null (no person linked).
 *
 * Usage:
 *   ADMIN_EMAIL=you@example.com npx tsx scripts/link-admin-user.ts
 *   npx tsx scripts/link-admin-user.ts you@example.com
 *
 * Requires: DATABASE_URL, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import dotenv from "dotenv";
dotenv.config();
dotenv.config({ path: ".env.local", override: true });

import { createClient } from "@supabase/supabase-js";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq } from "drizzle-orm";
import { people, roles } from "../lib/db/schema";
import { schema } from "../lib/db/schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

const pgClient = postgres(process.env.DATABASE_URL, { ssl: "require" });
const db = drizzle(pgClient, { schema });

function createAdminSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error(
      "Need NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY"
    );
  }
  return createClient(url, serviceRoleKey);
}

function parseNameFromEmail(email: string): { firstName: string; lastName: string } {
  const local = email.split("@")[0] ?? "Admin";
  const parts = local.split(/[._-]/).filter(Boolean);
  if (parts.length >= 2) {
    return {
      firstName: parts[0]!.charAt(0).toUpperCase() + parts[0]!.slice(1).toLowerCase(),
      lastName: parts[1]!.charAt(0).toUpperCase() + parts[1]!.slice(1).toLowerCase(),
    };
  }
  return {
    firstName: local.charAt(0).toUpperCase() + local.slice(1).toLowerCase(),
    lastName: "User",
  };
}

async function linkAdminUser() {
  const email =
    process.env.ADMIN_EMAIL ?? process.argv[2];
  if (!email?.includes("@")) {
    console.error("Usage: ADMIN_EMAIL=you@example.com npx tsx scripts/link-admin-user.ts");
    console.error("   or: npx tsx scripts/link-admin-user.ts you@example.com");
    process.exit(1);
  }

  const supabase = createAdminSupabaseClient();

  const { data: listData, error: listError } = await supabase.auth.admin.listUsers({
    perPage: 1000,
  });
  if (listError) {
    console.error("Supabase listUsers failed:", listError.message);
    if (listError.message?.toLowerCase().includes("invalid api key")) {
      console.error("\n→ Use the SERVICE ROLE key (secret), not the anon key.");
      console.error("  Supabase Dashboard → Settings → API → service_role (copy the secret).");
      console.error("  Set SUPABASE_SERVICE_ROLE_KEY in .env.local and run again.");
    }
    process.exit(1);
  }
  const authUser = listData?.users?.find(
    (u) => u.email?.toLowerCase() === email.toLowerCase()
  );
  if (!authUser?.id) {
    console.error(`No Supabase Auth user found with email: ${email}`);
    process.exit(1);
  }

  const [adminRole] = await db
    .select({ id: roles.id })
    .from(roles)
    .where(eq(roles.name, "Admin"))
    .limit(1);
  if (!adminRole) {
    console.error("Admin role not found. Run seed (e.g. seedPilotData) first.");
    process.exit(1);
  }

  const existing = await db
    .select({ id: people.id, authUserId: people.authUserId })
    .from(people)
    .where(eq(people.email, email))
    .limit(1);

  const metadata = authUser.user_metadata as { full_name?: string } | undefined;
  const nameFromMeta =
    typeof metadata?.full_name === "string" && metadata.full_name.trim()
      ? metadata.full_name.trim().split(/\s+/)
      : null;
  const firstName = nameFromMeta?.[0] ?? parseNameFromEmail(email).firstName;
  const lastName =
    nameFromMeta && nameFromMeta.length > 1
      ? nameFromMeta.slice(1).join(" ")
      : parseNameFromEmail(email).lastName;

  if (existing[0]) {
    await db
      .update(people)
      .set({
        authUserId: authUser.id,
        roleId: adminRole.id,
        firstName,
        lastName,
        status: "active",
      })
      .where(eq(people.id, existing[0].id));
    console.log(
      `Updated person for ${email} -> linked auth user and set Admin role.`
    );
  } else {
    const [inserted] = await db
      .insert(people)
      .values({
        firstName,
        lastName,
        email,
        roleId: adminRole.id,
        authUserId: authUser.id,
        status: "active",
      })
      .returning({ id: people.id });
    if (inserted) {
      console.log(
        `Created Admin person for ${email} (id: ${inserted.id}). Log in again to see full access.`
      );
    }
  }
}

linkAdminUser()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => pgClient.end());
