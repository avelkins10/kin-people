import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { activityLog, people } from "@/lib/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { withPermission } from "@/lib/auth/route-protection";
import { Permission } from "@/lib/permissions/types";

const ENTITY_TYPES = ["office", "role", "team", "pay_plan", "commission_rule"] as const;

export const GET = withPermission(
  Permission.MANAGE_SETTINGS,
  async (req: NextRequest) => {
    try {
      const { searchParams } = new URL(req.url);
      const entityType = searchParams.get("entityType");
      const entityId = searchParams.get("entityId");
      const limitParam = searchParams.get("limit");
      const limit = Math.min(
        Math.max(parseInt(limitParam ?? "50", 10) || 50, 1),
        200
      );

      const conditions: ReturnType<typeof eq>[] = [];
      if (entityType && ENTITY_TYPES.includes(entityType as (typeof ENTITY_TYPES)[number])) {
        conditions.push(eq(activityLog.entityType, entityType));
      }
      if (entityId) {
        conditions.push(eq(activityLog.entityId, entityId));
      }

      const baseQuery = db
        .select({
          id: activityLog.id,
          entityType: activityLog.entityType,
          entityId: activityLog.entityId,
          action: activityLog.action,
          details: activityLog.details,
          actorId: activityLog.actorId,
          createdAt: activityLog.createdAt,
          actorFirstName: people.firstName,
          actorLastName: people.lastName,
        })
        .from(activityLog)
        .leftJoin(people, eq(activityLog.actorId, people.id));

      const rows =
        conditions.length > 0
          ? await baseQuery
              .where(and(...conditions))
              .orderBy(desc(activityLog.createdAt))
              .limit(limit)
          : await baseQuery.orderBy(desc(activityLog.createdAt)).limit(limit);

      const list = rows.map((r) => ({
        id: r.id,
        entityType: r.entityType,
        entityId: r.entityId,
        action: r.action,
        details: r.details,
        actorId: r.actorId,
        actorName:
          r.actorFirstName && r.actorLastName
            ? `${r.actorFirstName} ${r.actorLastName}`
            : r.actorId
              ? "Unknown"
              : null,
        createdAt: r.createdAt,
      }));

      return NextResponse.json(list);
    } catch (error: unknown) {
      console.error("Error fetching activity log:", error);
      return NextResponse.json(
        { error: (error as Error).message || "Internal server error" },
        { status: 500 }
      );
    }
  }
);
