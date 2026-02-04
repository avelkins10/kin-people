import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withAuth } from "@/lib/auth/route-protection";
import { canViewDocument } from "@/lib/auth/visibility-rules";
import { getDocumentWithDetails } from "@/lib/db/helpers/document-helpers";
import { createEmbeddedSigningLink } from "@/lib/integrations/signnow-sdk";

const documentIdSchema = z.object({ id: z.string().uuid() });

const bodySchema = z.object({
  fieldInviteId: z.string().min(1, "fieldInviteId is required"),
  linkExpirationSeconds: z.number().int().positive().optional(),
});

/**
 * POST /api/documents/[id]/embedded-link
 * Generate an embedded signing link for in-app signing.
 * Requires fieldInviteId from the document's field invites.
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

      const body = await req.json();
      const bodyParsed = bodySchema.safeParse(body);
      if (!bodyParsed.success) {
        return NextResponse.json(
          { error: bodyParsed.error.errors[0]?.message ?? "Invalid request body" },
          { status: 400 }
        );
      }

      const { fieldInviteId, linkExpirationSeconds } = bodyParsed.data;
      const link = await createEmbeddedSigningLink(
        signnowDocumentId,
        fieldInviteId,
        linkExpirationSeconds
      );

      return NextResponse.json({ link });
    } catch (error) {
      console.error("[api/documents/[id]/embedded-link] POST failed", {
        id: validId,
        error,
      });
      const message =
        error instanceof Error ? error.message : "Failed to generate embedded signing link";
      return NextResponse.json(
        { error: message },
        { status: 500 }
      );
    }
  })(req);
}
