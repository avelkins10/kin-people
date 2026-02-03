import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withAuth, withPermission } from "@/lib/auth/route-protection";
import { Permission } from "@/lib/permissions/types";
import { canViewDocument } from "@/lib/auth/visibility-rules";
import { getDocumentWithDetails } from "@/lib/db/helpers/document-helpers";
import { voidDocument as voidDocumentInDb } from "@/lib/db/helpers/document-helpers";
import { voidDocument as voidSignNowDocument } from "@/lib/integrations/signnow";

const documentIdSchema = z.object({ id: z.string().uuid() });

export async function GET(
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
          { error: "You do not have permission to view this document" },
          { status: 403 }
        );
      }
      return NextResponse.json(doc);
    } catch (error) {
      console.error("[api/documents/[id]] GET failed", { id: validId, error });
      return NextResponse.json(
        { error: "Failed to fetch document" },
        { status: 500 }
      );
    }
  })(req);
}

export async function DELETE(
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
  return withPermission(Permission.MANAGE_SETTINGS, async (_req, _user) => {
    try {
      const doc = await getDocumentWithDetails(validId);
      if (!doc) {
        return NextResponse.json(
          { error: "Document not found" },
          { status: 404 }
        );
      }
      const signnowDocumentId = doc.document.signnowDocumentId;
      await voidDocumentInDb(validId);
      if (signnowDocumentId) {
        try {
          await voidSignNowDocument(signnowDocumentId);
        } catch (signNowErr) {
          console.error("[api/documents/[id]] DELETE: SignNow void failed", {
            id: validId,
            signnowDocumentId,
            error: signNowErr,
          });
          // DB is already voided; log and continue
        }
      }
      return NextResponse.json({
        success: true,
        message: "Document voided successfully",
      });
    } catch (error) {
      console.error("[api/documents/[id]] DELETE failed", {
        id: validId,
        error,
      });
      return NextResponse.json(
        { error: "Failed to void document" },
        { status: 500 }
      );
    }
  })(req);
}
