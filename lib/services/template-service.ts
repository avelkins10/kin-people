import { db } from "@/lib/db";
import { documentTemplates, people, roles } from "@/lib/db/schema";
import { eq, and, or } from "drizzle-orm";
import { getTemplates } from "@/lib/integrations/signnow";
import type { DocumentTemplate } from "@/lib/db/schema/document-templates";

const CONFIG_CACHE_TTL_MS = 3600000; // 1 hour
const SIGNNOW_CACHE_TTL_MS = 3600000; // 1 hour

/** Individual signer with email, name, role, and order (1 = parallel signing). */
export interface SignerInfo {
  email: string;
  name: string;
  role: string;
  order: number;
}

/** Recruit-shaped entity for signer resolution (has targetReportsToId for manager). */
export interface RecruitTemplateEntity {
  email: string;
  firstName?: string;
  lastName?: string;
  targetReportsToId?: string | null;
}

/** Person-shaped entity for signer resolution (has reportsToId for manager). */
export interface PersonTemplateEntity {
  email: string;
  firstName?: string;
  lastName?: string;
  reportsToId?: string | null;
}

/** Union type for recruit or person entities with manager info. */
export type TemplateEntity = RecruitTemplateEntity | PersonTemplateEntity;

type ConfigCacheEntry = { config: DocumentTemplate | null; timestamp: number };
type SignNowCacheEntry = {
  templates: Array<{ id: string; name: string }>;
  timestamp: number;
};

const configCache = new Map<string, ConfigCacheEntry>();
const signNowCache = new Map<string, SignNowCacheEntry>();

function isConfigCacheExpired(entry: ConfigCacheEntry): boolean {
  return Date.now() - entry.timestamp > CONFIG_CACHE_TTL_MS;
}

function isSignNowCacheExpired(entry: SignNowCacheEntry): boolean {
  return Date.now() - entry.timestamp > SIGNNOW_CACHE_TTL_MS;
}

/**
 * Get template configuration for a document type from the database.
 * Results are cached per document type with a 1-hour TTL.
 */
export async function getTemplateConfig(
  documentType: string
): Promise<DocumentTemplate | null> {
  const cached = configCache.get(documentType);
  if (cached && !isConfigCacheExpired(cached)) {
    return cached.config;
  }

  try {
    const rows = await db
      .select()
      .from(documentTemplates)
      .where(
        and(
          eq(documentTemplates.documentType, documentType),
          eq(documentTemplates.isActive, true)
        )
      )
      .limit(1);

    const config = rows[0] ?? null;
    configCache.set(documentType, { config, timestamp: Date.now() });
    return config;
  } catch (err) {
    console.error(
      "[template-service] getTemplateConfig failed",
      { documentType },
      err
    );
    throw err;
  }
}

/**
 * Resolve signers for a template based on config and entity (recruit or person).
 * Returns an array of SignerInfo with order 1 for parallel signing.
 */
export async function resolveSigners(
  templateConfig: DocumentTemplate,
  entity: TemplateEntity
): Promise<SignerInfo[]> {
  if (!templateConfig) {
    throw new Error("resolveSigners: templateConfig is required");
  }

  const email =
    "email" in entity ? entity.email : (entity as PersonTemplateEntity).email;
  if (!email || typeof email !== "string") {
    throw new Error("resolveSigners: entity must have a valid email");
  }

  const signers: SignerInfo[] = [];
  const seenEmails = new Set<string>();

  const addSigner = (info: SignerInfo) => {
    if (seenEmails.has(info.email.toLowerCase())) return;
    seenEmails.add(info.email.toLowerCase());
    signers.push({ ...info, order: 1 });
  };

  if (templateConfig.requireRecruit) {
    const first = "firstName" in entity ? entity.firstName : undefined;
    const last = "lastName" in entity ? entity.lastName : undefined;
    const name =
      first != null || last != null
        ? [first, last].filter(Boolean).join(" ").trim()
        : email;
    addSigner({ email, name: name || email, role: "Signer", order: 1 });
  }

  if (templateConfig.requireManager) {
    const managerId =
      "targetReportsToId" in entity
        ? (entity as RecruitTemplateEntity).targetReportsToId
        : (entity as PersonTemplateEntity).reportsToId;

    if (!managerId) {
      throw new Error(
        "resolveSigners: manager is required but entity has no manager (targetReportsToId/reportsToId)"
      );
    }

    let manager: { email: string; firstName: string | null; lastName: string | null } | undefined;
    try {
      const managerRows = await db
        .select({
          email: people.email,
          firstName: people.firstName,
          lastName: people.lastName,
        })
        .from(people)
        .where(eq(people.id, managerId))
        .limit(1);

      manager = managerRows[0];
    } catch (err) {
      throw new Error(
        `resolveSigners: failed to fetch required manager (id: ${managerId}): ${err instanceof Error ? err.message : String(err)}`
      );
    }

    if (!manager?.email) {
      throw new Error(
        `resolveSigners: manager is required but no person record with email found for manager id: ${managerId}`
      );
    }

    const name = [manager.firstName, manager.lastName]
      .filter(Boolean)
      .join(" ")
      .trim();
    addSigner({
      email: manager.email,
      name: name || manager.email,
      role: "Manager",
      order: 1,
    });
  }

  if (templateConfig.requireHR) {
    let hrPerson: { email: string; firstName: string | null; lastName: string | null } | undefined;
    try {
      const hrRows = await db
        .select({
          email: people.email,
          firstName: people.firstName,
          lastName: people.lastName,
        })
        .from(people)
        .innerJoin(roles, eq(people.roleId, roles.id))
        .where(
          and(
            eq(people.status, "active"),
            eq(roles.isActive, true),
            or(
              eq(roles.name, "HR"),
              eq(roles.name, "Human Resources")
            )
          )
        )
        .limit(1);

      hrPerson = hrRows[0];
    } catch (err) {
      throw new Error(
        `resolveSigners: failed to fetch required HR signer: ${err instanceof Error ? err.message : String(err)}`
      );
    }

    if (!hrPerson?.email) {
      throw new Error(
        "resolveSigners: HR signer is required but no active HR person (role HR or Human Resources) with email found"
      );
    }

    const name = [hrPerson.firstName, hrPerson.lastName]
      .filter(Boolean)
      .join(" ")
      .trim();
    addSigner({
      email: hrPerson.email,
      name: name || hrPerson.email,
      role: "HR",
      order: 1,
    });
  }

  return signers;
}

/**
 * Get SignNow templates with in-memory cache (1-hour TTL).
 * On API failure returns an empty array and logs the error.
 */
export async function getSignNowTemplates(): Promise<
  Array<{ id: string; name: string }>
> {
  const key = "signnow_templates";
  const cached = signNowCache.get(key);
  if (cached && !isSignNowCacheExpired(cached)) {
    return cached.templates;
  }

  try {
    const templates = await getTemplates();
    signNowCache.set(key, { templates, timestamp: Date.now() });
    return templates;
  } catch (err) {
    console.error("[template-service] getSignNowTemplates failed", err);
    return [];
  }
}

/**
 * Clear template config cache. If documentType is provided, clear that entry only; otherwise clear all.
 */
export function clearTemplateConfigCache(documentType?: string): void {
  if (documentType !== undefined) {
    configCache.delete(documentType);
  } else {
    configCache.clear();
  }
}

/**
 * Get template config and throw a descriptive error if not found or inactive.
 * Use for strict validation in document service.
 */
export async function getTemplateConfigWithValidation(
  documentType: string
): Promise<DocumentTemplate> {
  const config = await getTemplateConfig(documentType);
  if (!config) {
    throw new Error(
      `Template not found or inactive for document type: ${documentType}`
    );
  }
  return config;
}
