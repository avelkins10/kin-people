import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { deals, people, offices } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { calculateCommissionsForDeal } from "@/lib/services/commission-calculator";

/**
 * QuickBase webhook endpoint for syncing deals.
 * 
 * TODO: This is a placeholder for future QuickBase integration.
 * Expected payload structure:
 * {
 *   quickbase_id: string,
 *   setter_email: string,
 *   closer_email: string,
 *   deal_type: string,
 *   system_size_kw?: number,
 *   ppw?: number,
 *   deal_value: number,
 *   sale_date?: string,
 *   close_date?: string,
 *   customer_name?: string,
 *   customer_address?: string,
 *   customer_email?: string,
 *   customer_phone?: string,
 *   office_name?: string,
 *   status?: string,
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // TODO: Verify webhook signature/authentication
    // const signature = req.headers.get("x-quickbase-signature");
    // if (process.env.QUICKBASE_WEBHOOK_SECRET && signature) {
    //   const isValid = verifyQuickBaseSignature(JSON.stringify(body), signature);
    //   if (!isValid) {
    //     return NextResponse.json(
    //       { error: "Invalid webhook signature" },
    //       { status: 401 }
    //     );
    //   }
    // }

    const {
      quickbase_id,
      setter_email,
      closer_email,
      deal_type,
      system_size_kw,
      ppw,
      deal_value,
      sale_date,
      close_date,
      customer_name,
      customer_address,
      customer_email,
      customer_phone,
      office_name,
      status,
    } = body;

    if (!quickbase_id || !setter_email || !closer_email || !deal_type || !deal_value) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Find setter and closer by email
    const [setter] = await db
      .select()
      .from(people)
      .where(eq(people.email, setter_email))
      .limit(1);

    if (!setter) {
      console.warn(`Setter not found for email: ${setter_email}`);
      return NextResponse.json(
        { error: `Setter not found: ${setter_email}` },
        { status: 404 }
      );
    }

    const [closer] = await db
      .select()
      .from(people)
      .where(eq(people.email, closer_email))
      .limit(1);

    if (!closer) {
      console.warn(`Closer not found for email: ${closer_email}`);
      return NextResponse.json(
        { error: `Closer not found: ${closer_email}` },
        { status: 404 }
      );
    }

    // Find office by name if provided
    let officeId = null;
    if (office_name) {
      const [office] = await db
        .select()
        .from(offices)
        .where(eq(offices.name, office_name))
        .limit(1);
      officeId = office?.id || null;
    }

    // Check if deal already exists by quickbaseId
    const [existingDeal] = await db
      .select()
      .from(deals)
      .where(eq(deals.quickbaseId, quickbase_id))
      .limit(1);

    const isSelfGen = setter.id === closer.id;

    if (existingDeal) {
      // Update existing deal
      const [updatedDeal] = await db
        .update(deals)
        .set({
          setterId: setter.id,
          closerId: closer.id,
          isSelfGen,
          officeId: officeId || existingDeal.officeId,
          dealType: deal_type,
          systemSizeKw: system_size_kw?.toString() || existingDeal.systemSizeKw,
          ppw: ppw?.toString() || existingDeal.ppw,
          dealValue: deal_value.toString(),
          saleDate: sale_date || existingDeal.saleDate,
          closeDate: close_date || existingDeal.closeDate,
          customerName: customer_name || existingDeal.customerName,
          customerAddress: customer_address || existingDeal.customerAddress,
          customerEmail: customer_email || existingDeal.customerEmail,
          customerPhone: customer_phone || existingDeal.customerPhone,
          status: status || existingDeal.status,
          updatedAt: new Date(),
        })
        .where(eq(deals.id, existingDeal.id))
        .returning();

      // TODO: Recalculate commissions if deal details changed significantly
      // For now, we'll skip recalculation on updates

      return NextResponse.json({ received: true, deal: updatedDeal, action: "updated" });
    } else {
      // Create new deal
      const [newDeal] = await db
        .insert(deals)
        .values({
          quickbaseId: quickbase_id,
          setterId: setter.id,
          closerId: closer.id,
          isSelfGen,
          officeId: officeId,
          dealType: deal_type,
          systemSizeKw: system_size_kw?.toString() || null,
          ppw: ppw?.toString() || null,
          dealValue: deal_value.toString(),
          saleDate: sale_date || null,
          closeDate: close_date || null,
          customerName: customer_name || null,
          customerAddress: customer_address || null,
          customerEmail: customer_email || null,
          customerPhone: customer_phone || null,
          status: status || "sold",
        })
        .returning();

      // Trigger commission calculation
      let commissionCount = 0;
      try {
        commissionCount = await calculateCommissionsForDeal(newDeal.id);
      } catch (calcError: any) {
        console.error("Error calculating commissions:", calcError);
        // Don't fail the webhook, but log the error
      }

      return NextResponse.json({
        received: true,
        deal: newDeal,
        commissionCount,
        action: "created",
      });
    }
  } catch (error: any) {
    console.error("Error processing QuickBase webhook:", error);
    // Return 200 to prevent webhook retries for our errors
    return NextResponse.json(
      { error: "Webhook processing failed", message: error.message },
      { status: 200 }
    );
  }
}
