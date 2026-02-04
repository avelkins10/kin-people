import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/route-protection";
import { voidDocument as voidSignNowDocument } from "@/lib/integrations/signnow";
import { verifyPreviewToken } from "@/lib/utils/preview-token";

const bodySchema = { previewToken: (x: unknown) => typeof x === "string" && x.length > 0 };

/**
 * POST /api/documents/void-preview
 * Body: { previewToken: string }
 * Voids the SignNow document that was created for preview (e.g. when user closes modal without sending).
 */
export async function POST(req: NextRequest) {
  return withAuth(async () => {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const previewToken =
      typeof body === "object" && body !== null && "previewToken" in body
        ? (body as { previewToken: unknown }).previewToken
        : undefined;

    if (!bodySchema.previewToken(previewToken)) {
      return NextResponse.json(
        { error: "Missing or invalid previewToken" },
        { status: 400 }
      );
    }

    const payload = verifyPreviewToken(previewToken as string);
    if (!payload) {
      return NextResponse.json(
        { error: "Invalid or expired preview token" },
        { status: 401 }
      );
    }

    try {
      await voidSignNowDocument(payload.signnowDocumentId);
      return NextResponse.json({ success: true });
    } catch (error) {
      console.error("[api/documents/void-preview] void failed", {
        signnowDocumentId: payload.signnowDocumentId,
        error,
      });
      return NextResponse.json(
        { error: "Failed to void preview document" },
        { status: 500 }
      );
    }
  })(req);
}
