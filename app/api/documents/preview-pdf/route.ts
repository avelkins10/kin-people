import { NextRequest, NextResponse } from "next/server";
import { downloadDocument } from "@/lib/integrations/signnow";
import { verifyPreviewToken } from "@/lib/utils/preview-token";

/**
 * GET /api/documents/preview-pdf?token=...
 * Returns the PDF for a preview document (created but not yet sent).
 * Token is short-lived and signed; no auth required.
 */
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token?.trim()) {
    return NextResponse.json(
      { error: "Missing or invalid preview token" },
      { status: 400 }
    );
  }

  const payload = verifyPreviewToken(token.trim());
  if (!payload) {
    return NextResponse.json(
      { error: "Invalid or expired preview token" },
      { status: 401 }
    );
  }

  try {
    const buffer = await downloadDocument(payload.signnowDocumentId);
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "inline; filename=preview.pdf",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("[api/documents/preview-pdf] download failed", {
      signnowDocumentId: payload.signnowDocumentId,
      error,
    });
    return NextResponse.json(
      { error: "Failed to load preview PDF" },
      { status: 500 }
    );
  }
}
