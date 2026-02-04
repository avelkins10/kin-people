import { NextRequest, NextResponse } from "next/server";
import { downloadDocument } from "@/lib/integrations/signnow";
import { verifyPreviewToken } from "@/lib/utils/preview-token";

function errorHtml(title: string, message: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title></head><body style="font-family:system-ui;max-width:480px;margin:2rem auto;padding:0 1rem;"><h1 style="font-size:1.25rem;">${title}</h1><p>${message}</p><p style="color:#666;font-size:0.875rem;">You can close this tab and try Preview again, or send the document without preview.</p></body></html>`;
}

/**
 * GET /api/documents/preview-pdf?token=...
 * Returns the PDF for a preview document (created but not yet sent).
 * Token is short-lived and signed; no auth required.
 */
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token?.trim()) {
    return new NextResponse(
      errorHtml("Preview unavailable", "Missing or invalid preview link."),
      { status: 400, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }

  const payload = verifyPreviewToken(token.trim());
  if (!payload) {
    return new NextResponse(
      errorHtml("Preview expired or invalid", "This preview link has expired or is invalid. Create a new preview from the Send Document modal."),
      { status: 401, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }

  try {
    const buffer = await downloadDocument(payload.signnowDocumentId);
    const body = new Uint8Array(buffer);
    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "inline; filename=preview.pdf",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    const statusCode =
      error && typeof error === "object" && "status" in error
        ? (error as { status?: number }).status
        : undefined;
    console.error("[api/documents/preview-pdf] download failed", {
      signnowDocumentId: payload.signnowDocumentId,
      statusCode,
      error,
    });
    const isForbiddenOrNotFound = statusCode === 403 || statusCode === 404;
    const message = isForbiddenOrNotFound
      ? "SignNow may not allow PDF download for documents that haven’t been sent yet. You can still send the document—recipients will get the correct PDF."
      : "The preview PDF could not be loaded. Try again or send the document without preview.";
    return new NextResponse(
      errorHtml("Preview could not be loaded", message),
      { status: 500, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }
}
