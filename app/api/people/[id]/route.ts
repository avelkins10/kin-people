import { NextRequest, NextResponse } from "next/server";
import { getPersonWithDetails } from "@/lib/db/helpers/person-helpers";
import { withAuth } from "@/lib/auth/route-protection";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return withAuth(async (req, user) => {
    try {
      const personData = await getPersonWithDetails(id);

      if (!personData) {
        return NextResponse.json(
          { error: "Person not found" },
          { status: 404 }
        );
      }

      return NextResponse.json(personData);
    } catch (error: any) {
      console.error("Error fetching person:", error);
      return NextResponse.json(
        { error: error.message || "Internal server error" },
        { status: 500 }
      );
    }
  })(req);
}
