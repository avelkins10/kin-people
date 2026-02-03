import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/route-protection";
import { canViewPerson } from "@/lib/auth/visibility-rules";
import { getDocumentsByPerson } from "@/lib/db/helpers/document-helpers";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return withAuth(async (_req, user) => {
    try {
      const allowed = await canViewPerson(user, id);
      if (!allowed) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      const documents = await getDocumentsByPerson(id);
      return NextResponse.json(documents);
    } catch (error) {
      console.error("Error fetching person documents:", error);
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Internal server error" },
        { status: 500 }
      );
    }
  })(req);
}
