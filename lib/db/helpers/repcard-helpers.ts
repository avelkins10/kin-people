import { db } from "@/lib/db";
import {
  repcardAccounts,
  repcardOfficeMappings,
  repcardRoleMappings,
  repcardRegionMappings,
  repcardPermissions,
  people,
  offices,
  roles,
  regions,
} from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import type { NewRepcardAccount } from "@/lib/db/schema/repcard-accounts";
import type { RepcardAccount } from "@/lib/db/schema/repcard-accounts";

// ---------------------------------------------------------------------------
// Account CRUD
// ---------------------------------------------------------------------------

export async function createRepcardAccount(
  data: Omit<NewRepcardAccount, "id" | "createdAt" | "updatedAt">
): Promise<RepcardAccount> {
  const [inserted] = await db
    .insert(repcardAccounts)
    .values(data)
    .returning();
  if (!inserted) {
    throw new Error("Failed to create RepCard account");
  }
  return inserted;
}

export interface RepcardAccountWithPerson {
  account: RepcardAccount;
  person: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export async function getRepcardAccountByPersonId(
  personId: string
): Promise<RepcardAccountWithPerson | null> {
  const rows = await db
    .select({
      account: repcardAccounts,
      person: {
        id: people.id,
        firstName: people.firstName,
        lastName: people.lastName,
        email: people.email,
      },
    })
    .from(repcardAccounts)
    .innerJoin(people, eq(repcardAccounts.personId, people.id))
    .where(eq(repcardAccounts.personId, personId))
    .limit(1);

  const row = rows[0];
  if (!row) return null;

  return {
    account: row.account,
    person: {
      id: row.person.id,
      firstName: row.person.firstName,
      lastName: row.person.lastName,
      email: row.person.email,
    },
  };
}

export async function getAllRepcardAccounts(statusFilter?: string) {
  const query = db
    .select({
      account: repcardAccounts,
      person: {
        id: people.id,
        firstName: people.firstName,
        lastName: people.lastName,
        email: people.email,
      },
    })
    .from(repcardAccounts)
    .innerJoin(people, eq(repcardAccounts.personId, people.id));

  if (statusFilter) {
    return query.where(eq(repcardAccounts.status, statusFilter));
  }
  return query;
}

export async function updateRepcardAccountFields(
  accountId: string,
  fields: Partial<Pick<RepcardAccount, "jobTitle" | "repcardRole" | "repcardOffice" | "repcardTeam" | "repcardUsername" | "repcardUserId">>
): Promise<RepcardAccount> {
  const [updated] = await db
    .update(repcardAccounts)
    .set({ ...fields, updatedAt: new Date() })
    .where(eq(repcardAccounts.id, accountId))
    .returning();
  if (!updated) {
    throw new Error("RepCard account not found or update failed");
  }
  return updated;
}

export async function setRepcardAccountStatus(
  accountId: string,
  status: string,
  error?: string
): Promise<RepcardAccount> {
  const update: Record<string, unknown> = {
    status,
    updatedAt: new Date(),
    lastSyncedAt: new Date(),
  };
  if (error !== undefined) {
    update.lastSyncError = error;
  } else if (status !== "error") {
    update.lastSyncError = null;
  }

  const [updated] = await db
    .update(repcardAccounts)
    .set(update as typeof repcardAccounts.$inferInsert)
    .where(eq(repcardAccounts.id, accountId))
    .returning();
  if (!updated) {
    throw new Error("RepCard account not found or update failed");
  }
  return updated;
}

export async function deleteRepcardAccountByPersonId(personId: string): Promise<void> {
  await db
    .delete(repcardAccounts)
    .where(eq(repcardAccounts.personId, personId));
}

export async function setRepcardAccountStatusByPersonId(
  personId: string,
  status: string,
  error?: string
): Promise<RepcardAccount | null> {
  const update: Record<string, unknown> = {
    status,
    updatedAt: new Date(),
    lastSyncedAt: new Date(),
  };
  if (error !== undefined) {
    update.lastSyncError = error;
  } else if (status !== "error") {
    update.lastSyncError = null;
  }

  const [updated] = await db
    .update(repcardAccounts)
    .set(update as typeof repcardAccounts.$inferInsert)
    .where(eq(repcardAccounts.personId, personId))
    .returning();
  return updated ?? null;
}

// ---------------------------------------------------------------------------
// Mapping Lookups
// ---------------------------------------------------------------------------

export async function getOfficeMappingByOfficeId(officeId: string) {
  const rows = await db
    .select()
    .from(repcardOfficeMappings)
    .where(eq(repcardOfficeMappings.officeId, officeId))
    .limit(1);
  return rows[0] ?? null;
}

export async function getRoleMappingByRoleId(roleId: string) {
  const rows = await db
    .select()
    .from(repcardRoleMappings)
    .where(eq(repcardRoleMappings.roleId, roleId))
    .limit(1);
  return rows[0] ?? null;
}

export async function getAllOfficeMappings() {
  return db
    .select({
      mapping: repcardOfficeMappings,
      office: {
        id: offices.id,
        name: offices.name,
      },
    })
    .from(repcardOfficeMappings)
    .innerJoin(offices, eq(repcardOfficeMappings.officeId, offices.id));
}

export async function getAllRoleMappings() {
  return db
    .select({
      mapping: repcardRoleMappings,
      role: {
        id: roles.id,
        name: roles.name,
      },
    })
    .from(repcardRoleMappings)
    .innerJoin(roles, eq(repcardRoleMappings.roleId, roles.id));
}

export async function upsertOfficeMappings(
  mappings: Array<{ officeId: string; repcardOffice: string; repcardTeam?: string }>
) {
  for (const m of mappings) {
    await db
      .insert(repcardOfficeMappings)
      .values({
        officeId: m.officeId,
        repcardOffice: m.repcardOffice,
        repcardTeam: m.repcardTeam ?? null,
      })
      .onConflictDoUpdate({
        target: repcardOfficeMappings.officeId,
        set: {
          repcardOffice: m.repcardOffice,
          repcardTeam: m.repcardTeam ?? null,
          updatedAt: new Date(),
        },
      });
  }
}

// Region mappings

export async function getAllRegionMappings() {
  return db
    .select({
      mapping: repcardRegionMappings,
      region: {
        id: regions.id,
        name: regions.name,
      },
    })
    .from(repcardRegionMappings)
    .innerJoin(regions, eq(repcardRegionMappings.regionId, regions.id));
}

export async function getRegionMappingByRegionId(regionId: string) {
  const rows = await db
    .select()
    .from(repcardRegionMappings)
    .where(eq(repcardRegionMappings.regionId, regionId))
    .limit(1);
  return rows[0] ?? null;
}

export async function upsertRegionMappings(
  mappings: Array<{ regionId: string; repcardOffice: string }>
) {
  for (const m of mappings) {
    await db
      .insert(repcardRegionMappings)
      .values({
        regionId: m.regionId,
        repcardOffice: m.repcardOffice,
      })
      .onConflictDoUpdate({
        target: repcardRegionMappings.regionId,
        set: {
          repcardOffice: m.repcardOffice,
          updatedAt: new Date(),
        },
      });
  }
}

export async function upsertRoleMappings(
  mappings: Array<{ roleId: string; repcardRole: string }>
) {
  for (const m of mappings) {
    await db
      .insert(repcardRoleMappings)
      .values({
        roleId: m.roleId,
        repcardRole: m.repcardRole,
      })
      .onConflictDoUpdate({
        target: repcardRoleMappings.roleId,
        set: {
          repcardRole: m.repcardRole,
          updatedAt: new Date(),
        },
      });
  }
}

// ---------------------------------------------------------------------------
// Permissions
// ---------------------------------------------------------------------------

export type RepcardOperation = "create" | "edit" | "deactivate" | "link" | "sync";

export async function checkRepcardPermission(
  roleId: string,
  operation: RepcardOperation
): Promise<boolean> {
  const rows = await db
    .select()
    .from(repcardPermissions)
    .where(eq(repcardPermissions.roleId, roleId))
    .limit(1);

  const perm = rows[0];
  if (!perm) return false;

  switch (operation) {
    case "create":
      return perm.canCreate;
    case "edit":
      return perm.canEdit;
    case "deactivate":
      return perm.canDeactivate;
    case "link":
      return perm.canLink;
    case "sync":
      return perm.canSync;
    default:
      return false;
  }
}

export async function getAllRepcardPermissions() {
  return db
    .select({
      permission: repcardPermissions,
      role: {
        id: roles.id,
        name: roles.name,
      },
    })
    .from(repcardPermissions)
    .innerJoin(roles, eq(repcardPermissions.roleId, roles.id));
}

export async function upsertRepcardPermissions(
  permissions: Array<{
    roleId: string;
    canCreate: boolean;
    canEdit: boolean;
    canDeactivate: boolean;
    canLink: boolean;
    canSync: boolean;
  }>
) {
  for (const p of permissions) {
    await db
      .insert(repcardPermissions)
      .values(p)
      .onConflictDoUpdate({
        target: repcardPermissions.roleId,
        set: {
          canCreate: p.canCreate,
          canEdit: p.canEdit,
          canDeactivate: p.canDeactivate,
          canLink: p.canLink,
          canSync: p.canSync,
          updatedAt: new Date(),
        },
      });
  }
}
