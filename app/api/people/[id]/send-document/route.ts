import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withAuth } from "@/lib/auth/route-protection";
import { canSendDocumentToPerson } from "@/lib/auth/visibility-rules";
import { getPersonWithDetails } from "@/lib/db/helpers/person-helpers";
import { sendDocument, sendDocumentFromPreview } from "@/lib/services/document-service";
import { sendDocumentSchema } from "@/lib/validation/document-schemas";
import { verifyPreviewToken } from "@/lib/utils/preview-token";
import { sanitizeErrorMessage } from "@/lib/utils";
import { isValidE164Phone, formatPhoneToE164 } from "@/lib/validation/phone";

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

      const allowed = await canSendDocumentToPerson(user, id);
      if (!allowed) {
        return NextResponse.json(
          { error: "You do not have permission to send documents to this person" },
          { status: 403 }
        );
      }

      const personData = await getPersonWithDetails(id);
      if (!personData) {
        return NextResponse.json(
          { error: "Person not found" },
          { status: 404 }
        );
      }

      // Validate phone number if SMS delivery is requested
      const deliveryMethod = validated.deliveryMethod ?? "email";
      if (deliveryMethod === "sms") {
        const phone = personData.person.phone;
        if (!phone) {
          return NextResponse.json(
            { error: "SMS delivery requires a phone number. Please add a phone number to this person first." },
            { status: 400 }
          );
        }
        const formattedPhone = formatPhoneToE164(phone);
        if (!formattedPhone || !isValidE164Phone(formattedPhone)) {
          return NextResponse.json(
            { error: "Invalid phone number format for SMS delivery. Expected format: +1XXXXXXXXXX" },
            { status: 400 }
          );
        }
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
            "person",
            id,
            validated.documentType,
            previewPayload.signnowDocumentId,
            user.id
          );
        } else {
          documentId = await sendDocument(
            "person",
            id,
            validated.documentType,
            user.id,
            { deliveryMethod }
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
      return NextResponse.json(
        { error: sanitizeErrorMessage(message, "Failed to send document. Please try again.") },
        { status: 500 }
      );
    }
  })(req);
}
