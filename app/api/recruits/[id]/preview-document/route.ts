import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withAuth } from "@/lib/auth/route-protection";
import { canSendDocumentToRecruit } from "@/lib/auth/visibility-rules";
import { createDocumentPreview } from "@/lib/services/document-service";
import { createPreviewToken } from "@/lib/utils/preview-token";
import { sendDocumentSchema } from "@/lib/validation/document-schemas";

function getBaseUrl(request: NextRequest): string {
  const url = request.url;
  try {
    const u = new URL(url);
    return `${u.protocol}//${u.host}`;
  } catch {
    return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return withAuth(async (request, user) => {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    try {
      const validated = sendDocumentSchema.pick({ documentType: true }).parse(body);

      const allowed = await canSendDocumentToRecruit(user, id);
      if (!allowed) {
        return NextResponse.json(
          { error: "You do not have permission to send documents to this recruit" },
          { status: 403 }
        );
      }

      const signnowDocumentId = await createDocumentPreview(
        "recruit",
        id,
        validated.documentType,
        user.id
      );

      const previewToken = createPreviewToken(signnowDocumentId);
      const baseUrl = getBaseUrl(request);
      const previewUrl = `${baseUrl}/api/documents/preview-pdf?token=${encodeURIComponent(previewToken)}`;

      return NextResponse.json({
        previewUrl,
        previewToken,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: "Validation failed", details: error.flatten() },
          { status: 400 }
        );
      }
      console.error("Preview document error:", error);
      const message =
        error instanceof Error ? error.message : String(error);
      const safeMessage =
        message.length > 400 ? `${message.slice(0, 397)}...` : message;
      return NextResponse.json(
        { error: safeMessage || "Failed to create preview. Please try again." },
        { status: 500 }
      );
    }
  })(req);
}
