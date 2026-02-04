import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { recruits } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { withAuth } from "@/lib/auth/route-protection";
import { canSendDocumentToRecruit } from "@/lib/auth/visibility-rules";
import { getRecruitWithDetails } from "@/lib/db/helpers/recruit-helpers";
import { sendDocument, sendDocumentFromPreview } from "@/lib/services/document-service";
import { sendDocumentSchema } from "@/lib/validation/document-schemas";
import { verifyPreviewToken } from "@/lib/utils/preview-token";

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
      const validated = sendDocumentSchema.parse(body);

      const allowed = await canSendDocumentToRecruit(user, id);
      if (!allowed) {
        return NextResponse.json(
          { error: "You do not have permission to send documents to this recruit" },
          { status: 403 }
        );
      }

      const recruitData = await getRecruitWithDetails(id);
      if (!recruitData) {
        return NextResponse.json(
          { error: "Recruit not found" },
          { status: 404 }
        );
      }

      const previewPayload = validated.previewToken
        ? verifyPreviewToken(validated.previewToken)
        : null;
      if (validated.previewToken && !previewPayload) {
        return NextResponse.json(
          { error: "Invalid or expired preview token. Create a new preview or send without preview." },
          { status: 400 }
        );
      }

      let documentId: string;
      try {
        if (previewPayload) {
          documentId = await sendDocumentFromPreview(
            "recruit",
            id,
            validated.documentType,
            previewPayload.signnowDocumentId,
            user.id
          );
        } else {
          documentId = await sendDocument(
            "recruit",
            id,
            validated.documentType,
            user.id
          );
        }
      } catch (docError) {
        const message =
          docError instanceof Error ? docError.message : String(docError);
        const isClientError =
          message.includes("Template not found or inactive") ||
          message.includes("missing a SignNow template ID");
        if (isClientError) {
          return NextResponse.json({ error: message }, { status: 400 });
        }
        throw docError;
      }

      if (validated.documentType === "rep_agreement") {
        await db
          .update(recruits)
          .set({
            status: "agreement_sent",
            agreementSentAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(recruits.id, id));
      }

      return NextResponse.json({
        success: true,
        documentId,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: "Validation failed", details: error.flatten() },
          { status: 400 }
        );
      }
      console.error("Send document error:", error);
      const message =
        error instanceof Error ? error.message : String(error);
      const safeMessage =
        message.length > 400 ? `${message.slice(0, 397)}...` : message;
      return NextResponse.json(
        { error: safeMessage || "Failed to send document. Please try again." },
        { status: 500 }
      );
    }
  })(req);
}
