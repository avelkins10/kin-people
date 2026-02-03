import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withAuth } from "@/lib/auth/route-protection";
import { canViewDocument } from "@/lib/auth/visibility-rules";
import { getDocumentWithDetails } from "@/lib/db/helpers/document-helpers";
import { getSignedUrl } from "@/lib/supabase/storage";

const BUCKET_NAME = "agreements";
const EXPIRES_IN = 3600;

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
      const storagePath = doc.document.storagePath;
      if (!storagePath || storagePath.trim() === "") {
        return NextResponse.json(
          { error: "Document is not yet stored; no download available" },
          { status: 400 }
        );
      }
      const signedUrl = await getSignedUrl(
        BUCKET_NAME,
        storagePath,
        EXPIRES_IN
      );
      return NextResponse.json({
        signedUrl,
        expiresIn: EXPIRES_IN,
      });
    } catch (error) {
      console.error("[api/documents/[id]/download] GET failed", {
        id: validId,
        error,
      });
      return NextResponse.json(
        { error: "Failed to generate download URL" },
        { status: 500 }
      );
    }
  })(req);
}
