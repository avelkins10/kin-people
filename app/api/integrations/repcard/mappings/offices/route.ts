import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withAuth } from "@/lib/auth/route-protection";
import {
  getAllOfficeMappings,
  upsertOfficeMappings,
} from "@/lib/db/helpers/repcard-helpers";

const updateSchema = z.array(
  z.object({
    officeId: z.string().uuid(),
    repcardOffice: z.string().min(1),
    repcardTeam: z.string().optional(),
  })
);

export const GET = withAuth(async () => {
  try {
    const mappings = await getAllOfficeMappings();
    return NextResponse.json(mappings);
  } catch (error: unknown) {
    console.error("Error fetching office mappings:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Internal server error" },
      { status: 500 }
    );
  }
});

export const PUT = withAuth(async (req: NextRequest, user) => {
  try {
    const body = await req.json();
    const validated = updateSchema.parse(body);
    await upsertOfficeMappings(validated);
    const updated = await getAllOfficeMappings();
    return NextResponse.json(updated);
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Error updating office mappings:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Internal server error" },
      { status: 500 }
    );
  }
});
