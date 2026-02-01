import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/route-protection";
import { canViewPerson } from "@/lib/auth/visibility-rules";
import { getPersonDocuments } from "@/lib/db/helpers/person-helpers";
import { getSignedUrl } from "@/lib/supabase/storage";

const BUCKET_NAME = "agreements";
const EXPIRES_IN = 300; // 5 minutes

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: personId } = await params;
  return withAuth(async (req, user) => {
    try {
      const allowed = await canViewPerson(user, personId);
      if (!allowed) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      const { searchParams } = new URL(req.url);
      const documentPath = searchParams.get("documentPath");

      if (!documentPath) {
        return NextResponse.json(
          { error: "documentPath is required" },
          { status: 400 }
        );
      }

      const documents = await getPersonDocuments(personId);
      const documentAllowed = documents.some((d) => d.documentPath === documentPath);

      if (!documentAllowed) {
        return NextResponse.json(
          { error: "Document not found or access denied" },
          { status: 404 }
        );
      }

      const signedUrl = await getSignedUrl(
        BUCKET_NAME,
        documentPath,
        EXPIRES_IN
      );

      return NextResponse.json({ signedUrl });
    } catch (error) {
      console.error("Error generating document download URL:", error);
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Internal server error" },
        { status: 500 }
      );
    }
  })(req);
}
