import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { recruitHistory, recruits, people, personHistory } from "@/lib/db/schema";
import { eq, inArray, desc, sql } from "drizzle-orm";
import { withAuth } from "@/lib/auth/route-protection";

const HYPE_STATUSES = ["lead", "offer_sent", "agreement_signed", "onboarding", "converted"];

export const GET = withAuth(async (req) => {
  try {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "15", 10) || 15, 50);

    // Query 1: recruit_history events (hype-worthy statuses)
    const recruitEvents = await db
      .select({
        id: recruitHistory.id,
        newStatus: recruitHistory.newStatus,
        createdAt: recruitHistory.createdAt,
        subjectFirstName: recruits.firstName,
        subjectLastName: recruits.lastName,
        actorFirstName: sql<string | null>`actor.first_name`,
        actorLastName: sql<string | null>`actor.last_name`,
      })
      .from(recruitHistory)
      .innerJoin(recruits, eq(recruitHistory.recruitId, recruits.id))
      .leftJoin(
        sql`${people} as actor`,
        sql`${recruitHistory.changedById} = actor.id`
      )
      .where(inArray(recruitHistory.newStatus, HYPE_STATUSES))
      .orderBy(desc(recruitHistory.createdAt))
      .limit(limit);

    // Query 2: person_history status_change where newValue indicates onboarding→active
    const personEvents = await db
      .select({
        id: personHistory.id,
        createdAt: personHistory.createdAt,
        previousValue: personHistory.previousValue,
        newValue: personHistory.newValue,
        subjectFirstName: people.firstName,
        subjectLastName: people.lastName,
        actorFirstName: sql<string | null>`actor.first_name`,
        actorLastName: sql<string | null>`actor.last_name`,
      })
      .from(personHistory)
      .innerJoin(people, eq(personHistory.personId, people.id))
      .leftJoin(
        sql`${people} as actor`,
        sql`${personHistory.changedById} = actor.id`
      )
      .where(eq(personHistory.changeType, "status_change"))
      .orderBy(desc(personHistory.createdAt))
      .limit(limit);

    // Map recruit_history events to feed items
    const recruitFeedItems = recruitEvents.map((row) => {
      let event: string;
      switch (row.newStatus) {
        case "lead":
          event = "lead";
          break;
        case "offer_sent":
          event = "offer_sent";
          break;
        case "agreement_signed":
          event = "agreement_signed";
          break;
        case "onboarding":
        case "converted":
          event = "hired";
          break;
        default:
          event = row.newStatus;
      }

      return {
        id: row.id,
        event,
        subjectName: `${row.subjectFirstName} ${row.subjectLastName}`,
        actorName:
          row.actorFirstName && row.actorLastName
            ? `${row.actorFirstName} ${row.actorLastName}`
            : null,
        createdAt: row.createdAt?.toISOString() ?? new Date().toISOString(),
      };
    });

    // Map person_history events — only include onboarding→active transitions
    const personFeedItems = personEvents
      .filter((row) => {
        const nv = row.newValue as Record<string, unknown> | null;
        return nv && (nv.status === "active" || nv.value === "active");
      })
      .filter((row) => {
        const pv = row.previousValue as Record<string, unknown> | null;
        // Accept if previousValue is unavailable or explicitly "onboarding"
        if (!pv) return true;
        return pv.status === "onboarding" || pv.value === "onboarding";
      })
      .map((row) => ({
        id: row.id,
        event: "onboarding_completed",
        subjectName: `${row.subjectFirstName} ${row.subjectLastName}`,
        actorName:
          row.actorFirstName && row.actorLastName
            ? `${row.actorFirstName} ${row.actorLastName}`
            : null,
        createdAt: row.createdAt?.toISOString() ?? new Date().toISOString(),
      }));

    // Combine and sort by createdAt DESC, take top N
    const items = [...recruitFeedItems, ...personFeedItems]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);

    return NextResponse.json({ items });
  } catch (error: unknown) {
    console.error("Error fetching feed:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Internal server error" },
      { status: 500 }
    );
  }
});
