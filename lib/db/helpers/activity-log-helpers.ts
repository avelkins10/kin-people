import { db } from "@/lib/db";
import { activityLog } from "@/lib/db/schema";

export interface LogActivityParams {
  entityType: "office" | "role" | "team" | "pay_plan" | "commission_rule";
  entityId: string;
  action: "created" | "updated" | "deleted";
  details?: Record<string, unknown>;
  actorId?: string | null;
}

export async function logActivity(params: LogActivityParams): Promise<void> {
  await db.insert(activityLog).values({
    entityType: params.entityType,
    entityId: params.entityId,
    action: params.action,
    details: params.details ?? null,
    actorId: params.actorId ?? null,
  });
}
