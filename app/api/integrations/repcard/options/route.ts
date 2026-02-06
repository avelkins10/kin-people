import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/route-protection";
import {
  getRepcardOffices,
  getRepcardAllTeams,
  getRepcardRoles,
} from "@/lib/integrations/repcard";

export const GET = withAuth(async () => {
  try {
    const [offices, teams, roles] = await Promise.all([
      getRepcardOffices(),
      getRepcardAllTeams(),
      getRepcardRoles(),
    ]);
    return NextResponse.json({ offices, teams, roles });
  } catch (error: unknown) {
    console.error("Error fetching RepCard options:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Internal server error" },
      { status: 500 }
    );
  }
});
