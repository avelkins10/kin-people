import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { people } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { withAuth } from "@/lib/auth/route-protection";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return withAuth(async () => {
    try {
      const [person] = await db
        .select({ authUserId: people.authUserId })
        .from(people)
        .where(eq(people.id, id))
        .limit(1);

      if (!person) {
        return NextResponse.json({ error: "Person not found" }, { status: 404 });
      }

      if (!person.authUserId) {
        return NextResponse.json({
          status: "not_invited",
          lastSignInAt: null,
          invitedAt: null,
          emailConfirmed: false,
        });
      }

      const supabaseAdmin = createAdminClient();
      const { data, error } = await supabaseAdmin.auth.admin.getUserById(
        person.authUserId
      );

      if (error || !data?.user) {
        return NextResponse.json({
          status: "not_invited",
          lastSignInAt: null,
          invitedAt: null,
          emailConfirmed: false,
        });
      }

      const user = data.user;
      const lastSignInAt = user.last_sign_in_at || null;
      const invitedAt = user.created_at || null;
      const emailConfirmed = !!user.email_confirmed_at;
      const status = lastSignInAt ? "active" : "invited";

      return NextResponse.json({
        status,
        lastSignInAt,
        invitedAt,
        emailConfirmed,
      });
    } catch (error: any) {
      console.error("[auth-status] Error:", error);
      return NextResponse.json(
        { error: error.message || "Internal server error" },
        { status: 500 }
      );
    }
  })(req);
}
