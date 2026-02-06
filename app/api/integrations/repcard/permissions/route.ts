import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withAuth } from "@/lib/auth/route-protection";
import {
  getAllRepcardPermissions,
  upsertRepcardPermissions,
} from "@/lib/db/helpers/repcard-helpers";

const updateSchema = z.array(
  z.object({
    roleId: z.string().uuid(),
    canCreate: z.boolean(),
    canEdit: z.boolean(),
    canDeactivate: z.boolean(),
    canLink: z.boolean(),
    canSync: z.boolean(),
  })
);

export const GET = withAuth(async () => {
  try {
    const permissions = await getAllRepcardPermissions();
    return NextResponse.json(permissions);
  } catch (error: unknown) {
    console.error("Error fetching RepCard permissions:", error);
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
    await upsertRepcardPermissions(validated);
    const updated = await getAllRepcardPermissions();
    return NextResponse.json(updated);
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Error updating RepCard permissions:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Internal server error" },
      { status: 500 }
    );
  }
});
