import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { recruits, recruitHistory } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { verifyWebhookSignature, getDocumentUrl } from "@/lib/integrations/signnow";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const signature = req.headers.get("x-signnow-signature");

    // Verify webhook signature if configured
    if (process.env.SIGNNOW_WEBHOOK_SECRET && signature) {
      const isValid = verifyWebhookSignature(
        JSON.stringify(body),
        signature
      );
      if (!isValid) {
        return NextResponse.json(
          { error: "Invalid webhook signature" },
          { status: 401 }
        );
      }
    }

    // Parse webhook payload
    const { event, document_id } = body;

    if (!document_id) {
      return NextResponse.json(
        { error: "Missing document_id" },
        { status: 400 }
      );
    }

    // Find recruit by SignNow document ID
    const [recruit] = await db
      .select()
      .from(recruits)
      .where(eq(recruits.signnowDocumentId, document_id))
      .limit(1);

    if (!recruit) {
      // Document not found in our system, but return 200 to acknowledge receipt
      console.warn(`SignNow webhook received for unknown document: ${document_id}`);
      return NextResponse.json({ received: true });
    }

    // Handle document.signed event
    if (event === "document.signed" || event === "document.complete") {
      // Get document URL
      const documentUrl = await getDocumentUrl(document_id);

      // Update recruit
      await db
        .update(recruits)
        .set({
          agreementSignedAt: new Date(),
          agreementDocumentUrl: documentUrl,
          status: "agreement_signed",
          updatedAt: new Date(),
        })
        .where(eq(recruits.id, recruit.id));

      // Create history record
      await db.insert(recruitHistory).values({
        recruitId: recruit.id,
        previousStatus: recruit.status,
        newStatus: "agreement_signed",
        notes: "Agreement signed via SignNow",
        changedById: null, // System event
      });
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("Error processing SignNow webhook:", error);
    // Return 200 to prevent webhook retries for our errors
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 200 }
    );
  }
}
