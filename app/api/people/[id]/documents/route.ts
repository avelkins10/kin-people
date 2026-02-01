import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/route-protection";
import { canViewPerson } from "@/lib/auth/visibility-rules";
import { getPersonDocuments } from "@/lib/db/helpers/person-helpers";
import { downloadDocument } from "@/lib/supabase/storage";

const BUCKET_NAME = "agreements";

function documentNameFromPath(documentPath: string): string {
  const segment = documentPath.split("/").pop();
  return segment?.trim() || documentPath || "Agreement";
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return withAuth(async (req, user) => {
    try {
      const allowed = await canViewPerson(user, id);
      if (!allowed) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      const rows = await getPersonDocuments(id);

      const documents = await Promise.all(
        rows.map(async (row) => {
          let fileSize = 0;
          try {
            const buffer = await downloadDocument(BUCKET_NAME, row.documentPath);
            fileSize = buffer.length;
          } catch (err) {
            console.error(
              `[documents] Failed to get size for ${row.documentPath}`,
              err
            );
          }
          return {
            id: row.recruitId,
            recruitId: row.recruitId,
            recruitName: row.recruitName,
            documentPath: row.documentPath,
            name: documentNameFromPath(row.documentPath),
            signedAt: row.signedAt,
            fileSize,
          };
        })
      );

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
