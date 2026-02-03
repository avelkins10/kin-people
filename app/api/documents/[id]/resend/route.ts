import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withAuth } from "@/lib/auth/route-protection";
import { canViewDocument } from "@/lib/auth/visibility-rules";
import { getDocumentWithDetails } from "@/lib/db/helpers/document-helpers";
import { resendDocument } from "@/lib/services/document-service";

const documentIdSchema = z.object({ id: z.string().uuid() });

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
          { error: "You do not have permission to resend this document" },
          { status: 403 }
        );
      }
      const status = doc.document.status ?? "pending";
      if (status === "signed" || status === "voided") {
        return NextResponse.json(
          { error: "Cannot resend signed or voided documents" },
          { status: 400 }
        );
      }
      const expiresAt = doc.document.expiresAt;
      if (!expiresAt || new Date(expiresAt) >= new Date()) {
        return NextResponse.json(
          { error: "Document has not expired yet" },
          { status: 400 }
        );
      }
      const newDocumentId = await resendDocument(validId, user.id);
      return NextResponse.json({
        success: true,
        newDocumentId,
      });
    } catch (error) {
      console.error("[api/documents/[id]/resend] POST failed", {
        id: validId,
        error,
      });
      const message =
        error instanceof Error ? error.message : "Failed to resend document";
      return NextResponse.json(
        { error: message },
        { status: 500 }
      );
    }
  })(req);
}
