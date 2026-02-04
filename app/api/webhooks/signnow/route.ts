import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { documents, recruits } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { verifyWebhookSignature, downloadDocument } from "@/lib/integrations/signnow";
import { uploadDocument } from "@/lib/supabase/storage";
import {
  getDocumentBySignnowId,
  updateDocumentStatus,
} from "@/lib/db/helpers/document-helpers";

const LOG_PREFIX = "[webhook/signnow]";

/** GET: SignNow may validate the webhook URL with a GET request; return 200 so the URL is accepted. */
export async function GET() {
  return NextResponse.json({ ok: true }, { status: 200 });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const signature = req.headers.get("x-signnow-signature");

    if (process.env.SIGNNOW_WEBHOOK_SECRET && signature) {
      const isValid = verifyWebhookSignature(JSON.stringify(body), signature);
      if (!isValid) {
        console.warn(`${LOG_PREFIX} invalid webhook signature, acknowledging to avoid retries`);
        return NextResponse.json({ received: true });
      }
    }

    // Normalize payload: SignNow may send event/document_id at top level or under meta/content (e.g. User-scoped webhooks)
    const rawEvent = (body.meta?.event ?? body.event) as string | undefined;
    // User-scoped webhooks prefix events with "user." (e.g. "user.document.complete" instead of "document.complete")
    const event = rawEvent?.replace(/^user\./, "") as string | undefined;
    // Document ID may be camelCase (documentId) or snake_case (document_id), at top level or under content
    const document_id = (body.content?.documentId ?? body.content?.document_id ?? body.documentId ?? body.document_id) as string | undefined;

    console.log(`${LOG_PREFIX} received rawEvent=${rawEvent} event=${event} document_id=${document_id}`);

    if (!document_id) {
      console.warn(`${LOG_PREFIX} missing document_id in webhook body, acknowledging to avoid retries`);
      return NextResponse.json({ received: true, error: "Missing document_id" });
    }

    const docWithDetails = await getDocumentBySignnowId(document_id);

    if (!docWithDetails) {
      console.warn(`${LOG_PREFIX} document not found for signnowDocumentId=${document_id}, acknowledging receipt`);
      return NextResponse.json({ received: true });
    }

    const { document } = docWithDetails;
    const documentId = document.id;

    switch (event) {
      case "document.open": {
        await updateDocumentStatus(documentId, "viewed", {
          viewedAt: new Date(),
        });
        console.log(`${LOG_PREFIX} document.open: documentId=${documentId}, status=viewed`);
        break;
      }

      case "document.fieldinvite.signed": {
        const totalSigners = document.totalSigners ?? 1;
        const [updated] = await db
          .update(documents)
          .set({
            signedCount: sql`${documents.signedCount} + 1`,
            updatedAt: new Date(),
          })
          .where(eq(documents.id, documentId))
          .returning({ signedCount: documents.signedCount });

        const newSignedCount = updated?.signedCount ?? 0;
        const newStatus =
          newSignedCount >= totalSigners ? "signed" : "partially_signed";

        await db
          .update(documents)
          .set({
            status: newStatus,
            updatedAt: new Date(),
            ...(newStatus === "signed" && { signedAt: new Date() }),
          })
          .where(eq(documents.id, documentId));

        console.log(
          `${LOG_PREFIX} document.fieldinvite.signed: documentId=${documentId}, signedCount=${newSignedCount}/${totalSigners}, status=${newStatus}`
        );
        break;
      }

      case "invite.expired": {
        await updateDocumentStatus(documentId, "expired", {
          expiresAt: new Date(),
        });
        console.log(`${LOG_PREFIX} invite.expired: documentId=${documentId}, status=expired`);
        break;
      }

      case "document.complete": {
        let storagePath: string | null = null;

        try {
          const pdfBuffer = await downloadDocument(document_id);
          const entityId = document.recruitId ?? document.personId;
          if (!entityId) {
            console.warn(`${LOG_PREFIX} document.complete: documentId=${documentId} has no recruitId or personId, skipping storage`);
          } else {
            const folder = document.recruitId
              ? `recruit-${document.recruitId}`
              : `person-${document.personId}`;
            const timestamp = Date.now();
            const fileName = `${document.documentType}-${entityId}-${timestamp}.pdf`;
            storagePath = await uploadDocument(
              pdfBuffer,
              fileName,
              "agreements",
              folder
            );
          }
        } catch (storageErr) {
          console.error(
            `${LOG_PREFIX} Storage upload failed for documentId=${documentId}, continuing without storage`,
            storageErr
          );
        }

        const timestamps: { signedAt?: Date } = {};
        if (!document.signedAt) {
          timestamps.signedAt = new Date();
        }

        await db
          .update(documents)
          .set({
            status: "signed",
            updatedAt: new Date(),
            ...(storagePath != null && { storagePath }),
            ...timestamps,
          })
          .where(eq(documents.id, documentId));

        if (document.recruitId && document.documentType === "rep_agreement") {
          await db
            .update(recruits)
            .set({
              status: "agreement_signed",
              agreementSignedAt: new Date(),
              ...(storagePath != null && { agreementDocumentPath: storagePath }),
              updatedAt: new Date(),
            })
            .where(eq(recruits.id, document.recruitId));
          console.log(
            `${LOG_PREFIX} document.complete: recruitId=${document.recruitId} → status=agreement_signed`
          );
        }

        console.log(
          `${LOG_PREFIX} document.complete: documentId=${documentId}, storagePath=${storagePath ?? "none"}, status=signed`
        );
        break;
      }

      default:
        console.log(`${LOG_PREFIX} unhandled event=${event} documentId=${documentId}, acknowledging`);
    }

    return NextResponse.json({ received: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`${LOG_PREFIX} error`, { error: message });
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 200 }
    );
  }
}
