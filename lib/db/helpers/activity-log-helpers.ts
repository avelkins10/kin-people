import { db } from "@/lib/db";
import { activityLog } from "@/lib/db/schema";

export interface LogActivityParams {
  entityType: "division" | "region" | "office" | "role" | "team" | "pay_plan" | "commission_rule" | "document_template" | "repcard_account";
  entityId: string;
  action: "created" | "updated" | "deleted" | "synced" | "deactivated" | "linked" | "sync_failed";
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
