import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { people } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

/**
 * GET /api/auth/debug
 *
 * Returns whether the server sees a Supabase session and a person row.
 * Use this to diagnose "wait for admin" when DB and person exist.
 * Remove or restrict in production once fixed.
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  const hasSession = !!authUser;
  const authUserId = authUser?.id ?? null;

  let hasPerson = false;
  if (authUserId) {
    const rows = await db
      .select({ id: people.id })
      .from(people)
      .where(eq(people.authUserId, authUserId))
      .limit(1);
    hasPerson = rows.length > 0;
  }

  return NextResponse.json({
    hasSession,
    hasPerson,
    hint: !hasSession
      ? "Server has no Supabase session (cookies not sent or wrong domain)."
      : !hasPerson
        ? "Session ok but no person row for this auth user in DB."
        : "Session and person both ok; getCurrentUser() should work.",
  });
}
