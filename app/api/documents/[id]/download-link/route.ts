import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withAuth } from "@/lib/auth/route-protection";
import { canViewDocument } from "@/lib/auth/visibility-rules";
import { getDocumentWithDetails } from "@/lib/db/helpers/document-helpers";
import { getDownloadLink } from "@/lib/integrations/signnow-sdk";

const documentIdSchema = z.object({ id: z.string().uuid() });

/**
 * POST /api/documents/[id]/download-link
 * Generate a shareable download link for the document from SignNow.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const parsed = documentIdSchema.safeParse({ id });
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid document ID; must be a valid UUID" },
      { status: 400 }
    );
  }
  const validId = parsed.data.id;
  return withAuth(async (_req, user) => {
    try {
      const doc = await getDocumentWithDetails(validId);
      if (!doc) {
        return NextResponse.json(
          { error: "Document not found" },
          { status: 404 }
        );
      }
      const allowed = await canViewDocument(user, validId);
      if (!allowed) {
        return NextResponse.json(
          { error: "You do not have permission to access this document" },
          { status: 403 }
        );
      }

      const signnowDocumentId = doc.document.signnowDocumentId;
      if (!signnowDocumentId) {
        return NextResponse.json(
          { error: "Document has no SignNow ID" },
          { status: 400 }
        );
      }

      const link = await getDownloadLink(signnowDocumentId);
      return NextResponse.json({ link });
    } catch (error) {
      console.error("[api/documents/[id]/download-link] POST failed", {
        id: validId,
        error,
      });
      const message =
        error instanceof Error ? error.message : "Failed to generate download link";
      return NextResponse.json(
        { error: message },
        { status: 500 }
      );
    }
  })(req);
}
