import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withAuth } from "@/lib/auth/route-protection";
import {
  getAllRoleMappings,
  upsertRoleMappings,
} from "@/lib/db/helpers/repcard-helpers";

const updateSchema = z.array(
  z.object({
    roleId: z.string().uuid(),
    repcardRole: z.string().min(1),
  })
);

export const GET = withAuth(async () => {
  try {
    const mappings = await getAllRoleMappings();
    return NextResponse.json(mappings);
  } catch (error: unknown) {
    console.error("Error fetching role mappings:", error);
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
    await upsertRoleMappings(validated);
    const updated = await getAllRoleMappings();
    return NextResponse.json(updated);
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Error updating role mappings:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Internal server error" },
      { status: 500 }
    );
  }
});
