import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { people } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { withPermission } from "@/lib/auth/route-protection";
import { Permission } from "@/lib/permissions/types";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return withPermission(Permission.MANAGE_SETTINGS, async (req) => {
    try {
      const [person] = await db
        .select({ id: people.id, email: people.email, authUserId: people.authUserId })
        .from(people)
        .where(eq(people.id, id))
        .limit(1);

      if (!person) {
        return NextResponse.json({ error: "Person not found" }, { status: 404 });
      }

      const supabaseAdmin = createAdminClient();
      const origin = req.headers.get("origin") || req.headers.get("referer")?.replace(/\/$/, "") || "";
      const { data: inviteData, error: inviteError } =
        await supabaseAdmin.auth.admin.inviteUserByEmail(person.email, {
          redirectTo: `${origin}/confirm`,
        });

      if (inviteError) {
        return NextResponse.json(
          { error: `Failed to send invite: ${inviteError.message}` },
          { status: 500 }
        );
      }

      // Link auth account if not already linked
      if (!person.authUserId && inviteData?.user?.id) {
        await db
          .update(people)
          .set({ authUserId: inviteData.user.id })
          .where(eq(people.id, id));
      }

      return NextResponse.json({ message: "Invite sent successfully" });
    } catch (error: any) {
      console.error("[resend-invite] Error:", error);
      return NextResponse.json(
        { error: error.message || "Internal server error" },
        { status: 500 }
      );
    }
  })(req);
}
