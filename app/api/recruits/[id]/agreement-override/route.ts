import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/route-protection";
import { hasPermission } from "@/lib/auth/check-permission";
import { Permission } from "@/lib/permissions/types";
import { db } from "@/lib/db";
import { recruits } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import {
  getRecruitWithDetails,
  createRecruitHistoryRecord,
} from "@/lib/db/helpers/recruit-helpers";
import { uploadDocument } from "@/lib/supabase/storage";

const BUCKET_NAME = "agreements";

/**
 * POST /api/recruits/[id]/agreement-override
 * Admin-only: set agreement_sent or agreement_signed with dates and optional PDF.
 * Body: FormData with status, agreementSentAt, agreementSignedAt (optional for agreement_sent), and optional file (PDF).
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: recruitId } = await params;
  return withAuth(async (request, user) => {
    if (!hasPermission(user, Permission.MANAGE_SETTINGS)) {
      return NextResponse.json(
        { error: "You do not have permission to override agreement status" },
        { status: 403 }
      );
    }

    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    const status = formData.get("status") as string | null;
    const agreementSentAtRaw = formData.get("agreementSentAt") as string | null;
    const agreementSignedAtRaw = formData.get(
      "agreementSignedAt"
    ) as string | null;
    const file = formData.get("file") as File | null;

    if (
      !status ||
      (status !== "agreement_sent" && status !== "agreement_signed")
    ) {
      return NextResponse.json(
        { error: "status must be agreement_sent or agreement_signed" },
        { status: 400 }
      );
    }

    const agreementSentAt = agreementSentAtRaw
      ? new Date(agreementSentAtRaw)
      : null;
    const agreementSignedAt = agreementSignedAtRaw
      ? new Date(agreementSignedAtRaw)
      : null;

    if (status === "agreement_sent" && !agreementSentAt) {
      return NextResponse.json(
        { error: "agreementSentAt is required for agreement_sent override" },
        { status: 400 }
      );
    }
    if (status === "agreement_signed") {
      if (!agreementSentAt) {
        return NextResponse.json(
          { error: "agreementSentAt is required for agreement_signed override" },
          { status: 400 }
        );
      }
      if (!agreementSignedAt) {
        return NextResponse.json(
          {
            error:
              "agreementSignedAt is required for agreement_signed override",
          },
          { status: 400 }
        );
      }
    }

    const [currentRecruit] = await db
      .select()
      .from(recruits)
      .where(eq(recruits.id, recruitId))
      .limit(1);

    if (!currentRecruit) {
      return NextResponse.json(
        { error: "Recruit not found" },
        { status: 404 }
      );
    }

    let storagePath: string | null = null;
    if (file && file.size > 0) {
      const contentType = file.type;
      if (contentType !== "application/pdf") {
        return NextResponse.json(
          { error: "Uploaded file must be a PDF" },
          { status: 400 }
        );
      }
      try {
        const buffer = Buffer.from(await file.arrayBuffer());
        const folder = `recruit-${recruitId}`;
        const timestamp = Date.now();
        const fileName = `override-${timestamp}.pdf`;
        storagePath = await uploadDocument(
          buffer,
          fileName,
          BUCKET_NAME,
          folder
        );
      } catch (uploadErr) {
        console.error("[agreement-override] upload failed", uploadErr);
        return NextResponse.json(
          { error: "Failed to upload PDF" },
          { status: 500 }
        );
      }
    }

    const updatePayload: {
      status: string;
      agreementSentAt: Date | null;
      agreementSignedAt: Date | null;
      agreementDocumentPath?: string | null;
      updatedAt: Date;
    } = {
      status,
      agreementSentAt,
      agreementSignedAt: status === "agreement_signed" ? agreementSignedAt : null,
      updatedAt: new Date(),
    };
    if (storagePath != null) {
      updatePayload.agreementDocumentPath = storagePath;
    }

    await db
      .update(recruits)
      .set(updatePayload)
      .where(eq(recruits.id, recruitId));

    await createRecruitHistoryRecord({
      recruitId,
      previousStatus: currentRecruit.status ?? null,
      newStatus: status,
      notes: "Admin override: agreement status set manually.",
      changedById: user.id,
    });

    const recruitData = await getRecruitWithDetails(recruitId);
    return NextResponse.json(recruitData);
  })(req);
}
