import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withAuth } from "@/lib/auth/route-protection";
import { canViewDocument } from "@/lib/auth/visibility-rules";
import { getDocumentWithDetails } from "@/lib/db/helpers/document-helpers";
import { cancelEmbeddedInvite } from "@/lib/integrations/signnow-sdk";

const documentIdSchema = z.object({ id: z.string().uuid() });

/**
 * POST /api/documents/[id]/cancel-invite
 * Cancel all embedded invites for a document without voiding the document itself.
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

      const status = doc.document.status ?? "pending";
      if (status === "signed" || status === "voided") {
        return NextResponse.json(
          { error: "Cannot cancel invites on signed or voided documents" },
          { status: 400 }
        );
      }

      await cancelEmbeddedInvite(signnowDocumentId);
      return NextResponse.json({ success: true });
    } catch (error) {
      console.error("[api/documents/[id]/cancel-invite] POST failed", {
        id: validId,
        error,
      });
      const message =
        error instanceof Error ? error.message : "Failed to cancel invite";
      return NextResponse.json(
        { error: message },
        { status: 500 }
      );
    }
  })(req);
}
