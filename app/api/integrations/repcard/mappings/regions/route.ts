import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withAuth } from "@/lib/auth/route-protection";
import {
  getAllRegionMappings,
  upsertRegionMappings,
} from "@/lib/db/helpers/repcard-helpers";

export const GET = withAuth(async () => {
  try {
    const mappings = await getAllRegionMappings();
    return NextResponse.json(mappings);
  } catch (error: unknown) {
    console.error("Error fetching region mappings:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Internal server error" },
      { status: 500 }
    );
  }
});

const updateSchema = z.array(
  z.object({
    regionId: z.string().uuid(),
    repcardOffice: z.string().min(1),
  })
);

export const PUT = withAuth(async (req: NextRequest) => {
  try {
    const body = await req.json();
    const validated = updateSchema.parse(body);
    await upsertRegionMappings(validated);
    const updated = await getAllRegionMappings();
    return NextResponse.json(updated);
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Error updating region mappings:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Internal server error" },
      { status: 500 }
    );
  }
});
