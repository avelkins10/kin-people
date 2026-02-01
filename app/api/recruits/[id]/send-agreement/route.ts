import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withPermission } from "@/lib/auth/route-protection";
import { Permission } from "@/lib/permissions/types";
import { canManageRecruit } from "@/lib/auth/visibility-rules";
import { getRecruitWithDetails } from "@/lib/db/helpers/recruit-helpers";
import { db } from "@/lib/db";
import { recruits, recruitHistory } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import {
  createDocument,
  sendForSignature,
  getDocumentUrl,
} from "@/lib/integrations/signnow";

const sendAgreementSchema = z.object({
  templateId: z.string().min(1, "Template ID is required"),
  signerName: z.string().min(1, "Signer name is required"),
  signerEmail: z.string().email("Valid signer email is required"),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return withPermission(Permission.MANAGE_OWN_OFFICE, async (req, user) => {
    try {
      // Parse and validate request body
      const body = await req.json();
      const validated = sendAgreementSchema.parse(body);

      // Check management permission
      const canManage = await canManageRecruit(user, id);
      if (!canManage) {
        return NextResponse.json(
          { error: "You do not have permission to manage this recruit" },
          { status: 403 }
        );
      }

      // Fetch recruit with all details
      const recruitData = await getRecruitWithDetails(id);
      if (!recruitData) {
        return NextResponse.json(
          { error: "Recruit not found" },
          { status: 404 }
        );
      }

      const { recruit, targetOffice, targetRole, targetPayPlan } = recruitData;

      // Verify recruit is in correct status
      if (recruit.status !== "offer_sent") {
        return NextResponse.json(
          { error: "Recruit must be in 'offer_sent' status to send agreement" },
          { status: 400 }
        );
      }

      // Prepare document data
      const documentData = {
        recruitName: `${recruit.firstName} ${recruit.lastName}`,
        recruitEmail: recruit.email || "",
        targetOffice: targetOffice?.name || "",
        targetRole: targetRole?.name || "",
        targetPayPlan: targetPayPlan?.name || "",
        recruiterName: recruitData.recruiter
          ? `${recruitData.recruiter.firstName} ${recruitData.recruiter.lastName}`
          : "",
      };

      // Create document from selected template
      const documentId = await createDocument(validated.templateId, documentData);

      // Send for signature with provided signer details
      await sendForSignature(
        documentId,
        validated.signerEmail,
        validated.signerName
      );

      // Get document URL
      const documentUrl = await getDocumentUrl(documentId);

      // Update recruit
      const [updated] = await db
        .update(recruits)
        .set({
          signnowDocumentId: documentId,
          agreementSentAt: new Date(),
          agreementDocumentUrl: documentUrl,
          status: "agreement_sent",
          updatedAt: new Date(),
        })
        .where(eq(recruits.id, id))
        .returning();

      // Create history record
      await db.insert(recruitHistory).values({
        recruitId: id,
        previousStatus: "offer_sent",
        newStatus: "agreement_sent",
        notes: "Agreement sent via SignNow",
        changedById: user.id,
      });

      return NextResponse.json({
        success: true,
        documentId,
        documentUrl,
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: "Invalid request data", details: error.errors },
          { status: 400 }
        );
      }
      console.error("Error sending agreement:", error);
      return NextResponse.json(
        { error: error.message || "Internal server error" },
        { status: 500 }
      );
    }
  })(req);
}
