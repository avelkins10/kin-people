import { db } from "@/lib/db";
import {
  createDocument,
  getDocumentWithDetails,
  voidDocument,
  updateDocumentStatus,
  deleteDocument,
  type DocumentWithDetails,
} from "@/lib/db/helpers/document-helpers";
import {
  getTemplateConfigWithValidation,
  resolveSigners,
  type SignerInfo,
  type RecruitTemplateEntity,
  type PersonTemplateEntity,
} from "@/lib/services/template-service";
import {
  createDocumentWithMultipleSigners as createDocumentWithMultipleSignersDirect,
  prefillSmartFields as prefillSmartFieldsDirect,
  sendMultipleInvites as sendMultipleInvitesDirect,
  voidDocument as voidSignNowDocument,
  type InviteOptions,
} from "@/lib/integrations/signnow";
import * as signnowSdk from "@/lib/integrations/signnow-sdk";

// Use SDK by default; set USE_SIGNNOW_SDK=false to use direct API for create/invite/prefill.
const useSignNowSdk = process.env.USE_SIGNNOW_SDK !== "false";
const createDocumentWithMultipleSigners = useSignNowSdk
  ? signnowSdk.createDocumentWithMultipleSigners
  : createDocumentWithMultipleSignersDirect;
const sendMultipleInvites = useSignNowSdk ? signnowSdk.sendMultipleInvites : sendMultipleInvitesDirect;
// Use text field prefill for regular text fields (most templates use these, not smart fields)
const prefillTextFields = useSignNowSdk ? signnowSdk.prefillTextFields : prefillSmartFieldsDirect;
import { documents, recruits, people, roles } from "@/lib/db/schema";
import { eq, and, lt, or, isNotNull, inArray, asc } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { getRecruitWithDetails } from "@/lib/db/helpers/recruit-helpers";
import { getPersonWithDetails } from "@/lib/db/helpers/person-helpers";
import { hasPermission } from "@/lib/auth/check-permission";
import { Permission } from "@/lib/permissions/types";
import type { CurrentUser } from "@/lib/auth/get-current-user";
import type { DocumentTemplate } from "@/lib/db/schema/document-templates";

// Re-export for consumers
export type { DocumentWithDetails };

export interface SendDocumentResult {
  documentId: string;
  signnowDocumentId: string;
}

type RecruitEntity = {
  recruit: {
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
    targetReportsToId: string | null;
    targetOfficeId: string | null;
    targetRoleId: string | null;
    targetPayPlanId: string | null;
    recruiterId: string;
  };
  targetOffice: { id: string; name: string } | null;
  targetRole: { id: string; name: string } | null;
  targetPayPlan: { id: string; name: string } | null;
  recruiter: { id: string; firstName: string; lastName: string; email: string } | null;
};

type PersonEntity = {
  person: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    reportsToId: string | null;
    officeId: string | null;
    roleId: string;
  };
  role: { id: string; name: string } | null;
  office: { id: string; name: string } | null;
  manager: { id: string; firstName: string; lastName: string; email: string } | null;
};

const documentPersonAlias = alias(people, "document_person");
const createdByAlias = alias(people, "created_by");

function buildFieldValues(
  entity: RecruitEntity | PersonEntity,
  documentType: string
): Array<{ field_name: string; field_value: string }> {
  const isRecruit = "recruit" in entity;
  const base = isRecruit
    ? (entity as RecruitEntity).recruit
    : (entity as PersonEntity).person;
  const name = [base.firstName, base.lastName].filter(Boolean).join(" ").trim();
  const email = base.email ?? "";
  const office = isRecruit
    ? (entity as RecruitEntity).targetOffice?.name ?? ""
    : (entity as PersonEntity).office?.name ?? "";
  const role = isRecruit
    ? (entity as RecruitEntity).targetRole?.name ?? ""
    : (entity as PersonEntity).role?.name ?? "";
  const payPlan = isRecruit
    ? (entity as RecruitEntity).targetPayPlan?.name ?? ""
    : "";
  const personManager = !isRecruit ? (entity as PersonEntity).manager : null;
  const manager = personManager
    ? [personManager.firstName, personManager.lastName].filter(Boolean).join(" ").trim()
    : "";
  const recruitRecruiter = isRecruit ? (entity as RecruitEntity).recruiter : null;
  const recruiter = recruitRecruiter
    ? [recruitRecruiter.firstName, recruitRecruiter.lastName].filter(Boolean).join(" ").trim()
    : "";

  // Send multiple possible field name formats to match various SignNow template configurations
  const fields: Array<{ field_name: string; field_value: string }> = [
    // Common field names
    { field_name: "name", field_value: name },
    { field_name: "email", field_value: email },
    { field_name: "office", field_value: office },
    { field_name: "role", field_value: role },
    { field_name: "pay_plan", field_value: payPlan },
    { field_name: "manager", field_value: manager },
    // Recruiter info
    { field_name: "recruiter_name", field_value: recruiter },
    // Recruit name variants (SignNow templates may use different naming)
    { field_name: "recruit_name", field_value: name },
    { field_name: "recruit_name_1", field_value: name },
    { field_name: "recruit_name_2", field_value: name },
    { field_name: "recruit_name_3", field_value: name },
    { field_name: "Full Name", field_value: name },
    { field_name: "full_name", field_value: name },
    // Other recruit fields
    { field_name: "recruit_email", field_value: email },
    { field_name: "target_office", field_value: office },
    { field_name: "target_role", field_value: role },
    { field_name: "target_pay_plan", field_value: payPlan },
  ];
  return fields;
}

function calculateExpirationDate(expirationDays: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + expirationDays);
  return date;
}

function buildInviteOptions(
  templateConfig: DocumentTemplate,
  documentType: string
): InviteOptions {
  const expirationDays = templateConfig.expirationDays ?? 30;
  const reminderDays = templateConfig.reminderFrequencyDays ?? 3;
  const subject =
    documentType === "rep_agreement"
      ? "Please sign your rep agreement"
      : `Please sign: ${templateConfig.displayName}`;
  const message =
    documentType === "rep_agreement"
      ? "Please review and sign your rep agreement."
      : `Please review and sign: ${templateConfig.displayName}.`;
  return {
    expirationDays,
    reminderDays,
    subject,
    message,
  };
}

function toRecruitTemplateEntity(data: RecruitEntity): RecruitTemplateEntity {
  const r = data.recruit;
  return {
    email: r.email ?? "",
    firstName: r.firstName,
    lastName: r.lastName,
    targetReportsToId: r.targetReportsToId,
  };
}

function toPersonTemplateEntity(data: PersonEntity): PersonTemplateEntity {
  const p = data.person;
  return {
    email: p.email,
    firstName: p.firstName,
    lastName: p.lastName,
    reportsToId: p.reportsToId,
  };
}

function signerInfoToConfig(signers: SignerInfo[]): Array<{ email: string; role: string; order?: number }> {
  return signers.map((s) => ({ email: s.email, role: s.role, order: s.order ?? 1 }));
}

/**
 * Send a new document for the given entity (recruit or person).
 * Orchestrates template config, signer resolution, SignNow creation, DB record, and invites.
 */
export async function sendDocument(
  entityType: "recruit" | "person",
  entityId: string,
  documentType: string,
  userId: string
): Promise<string> {
  try {
    let entity: RecruitEntity | PersonEntity | null = null;
    if (entityType === "recruit") {
      const data = await getRecruitWithDetails(entityId);
      if (!data) throw new Error(`Recruit not found: ${entityId}`);
      entity = data;
    } else {
      const data = await getPersonWithDetails(entityId);
      if (!data) throw new Error(`Person not found: ${entityId}`);
      entity = data;
    }

    const templateConfig = await getTemplateConfigWithValidation(documentType);
    const templateEntity =
      entityType === "recruit"
        ? toRecruitTemplateEntity(entity as RecruitEntity)
        : toPersonTemplateEntity(entity as PersonEntity);
    const signers = await resolveSigners(templateConfig, templateEntity);

    const firstName = entityType === "recruit"
      ? (entity as RecruitEntity).recruit.firstName
      : (entity as PersonEntity).person.firstName;
    const lastName = entityType === "recruit"
      ? (entity as RecruitEntity).recruit.lastName
      : (entity as PersonEntity).person.lastName;
    const documentName = `${documentType} - ${firstName} ${lastName}`;
    const fieldValues = buildFieldValues(entity, documentType);

    const signnowTemplateId = templateConfig.signnowTemplateId;
    if (!signnowTemplateId) {
      throw new Error(
        `Template ${documentType} is missing a SignNow template ID.`
      );
    }

    const signnowDocumentId = await createDocumentWithMultipleSigners(
      signnowTemplateId,
      signerInfoToConfig(signers),
      documentName,
      fieldValues
    );

    if (fieldValues.length > 0) {
      try {
        await prefillTextFields(signnowDocumentId, fieldValues);
      } catch (prefillErr) {
        console.warn("[document-service] sendDocument: prefill text fields failed, continuing without pre-filled fields", {
          signnowDocumentId,
          error: prefillErr instanceof Error ? prefillErr.message : String(prefillErr),
        });
      }
    }

    const expirationDays = templateConfig.expirationDays ?? 30;
    const expiresAt = calculateExpirationDate(expirationDays);

    const docData = {
      ...(entityType === "recruit" ? { recruitId: entityId } : { personId: entityId }),
      documentType,
      signnowDocumentId,
      signnowTemplateId: templateConfig.signnowTemplateId ?? undefined,
      status: "pending" as const,
      totalSigners: signers.length,
      signedCount: 0,
      createdById: userId,
      expiresAt,
      metadata: {
        signers: signers.map((s) => ({ email: s.email, role: s.role })),
        templateDocumentType: documentType,
      },
    };

    const created = await createDocument(docData);
    const documentId = created.id;

    try {
      const inviteOptions = buildInviteOptions(templateConfig, documentType);
      await sendMultipleInvites(signnowDocumentId, signerInfoToConfig(signers), inviteOptions);
    } catch (inviteErr) {
      await deleteDocument(documentId);
      try {
        await voidSignNowDocument(signnowDocumentId);
      } catch (voidErr) {
        console.error("[document-service] sendDocument: failed to void SignNow document after invite failure", {
          signnowDocumentId,
          voidError: voidErr instanceof Error ? voidErr.message : String(voidErr),
        });
      }
      throw inviteErr;
    }

    await updateDocumentStatus(documentId, "pending", { sentAt: new Date() });

    return documentId;
  } catch (err) {
    console.error("[document-service] sendDocument failed", {
      entityType,
      entityId,
      documentType,
      userId,
      error: err instanceof Error ? err.message : String(err),
    });
    if (err instanceof Error) throw err;
    throw new Error(
      `Failed to send document: ${err instanceof Error ? err.message : String(err)}`
    );
  }
}

/**
 * Create a document in SignNow from the template (with field values) but do not send invites or save to DB.
 * Used for "preview before send". Caller can show the PDF via preview-pdf API and then call sendDocumentFromPreview.
 */
export async function createDocumentPreview(
  entityType: "recruit" | "person",
  entityId: string,
  documentType: string,
  _userId: string
): Promise<string> {
  let entity: RecruitEntity | PersonEntity | null = null;
  if (entityType === "recruit") {
    const data = await getRecruitWithDetails(entityId);
    if (!data) throw new Error(`Recruit not found: ${entityId}`);
    entity = data;
  } else {
    const data = await getPersonWithDetails(entityId);
    if (!data) throw new Error(`Person not found: ${entityId}`);
    entity = data;
  }

  const templateConfig = await getTemplateConfigWithValidation(documentType);
  const templateEntity =
    entityType === "recruit"
      ? toRecruitTemplateEntity(entity as RecruitEntity)
      : toPersonTemplateEntity(entity as PersonEntity);
  const signers = await resolveSigners(templateConfig, templateEntity);

  const firstName = entityType === "recruit"
    ? (entity as RecruitEntity).recruit.firstName
    : (entity as PersonEntity).person.firstName;
  const lastName = entityType === "recruit"
    ? (entity as RecruitEntity).recruit.lastName
    : (entity as PersonEntity).person.lastName;
  const documentName = `${documentType} - ${firstName} ${lastName}`;
  const fieldValues = buildFieldValues(entity, documentType);

  const signnowTemplateId = templateConfig.signnowTemplateId;
  if (!signnowTemplateId) {
    throw new Error(
      `Template ${documentType} is missing a SignNow template ID.`
    );
  }

  const signnowDocumentId = await createDocumentWithMultipleSigners(
    signnowTemplateId,
    signerInfoToConfig(signers),
    documentName,
    fieldValues
  );
  if (fieldValues.length > 0) {
    try {
      await prefillTextFields(signnowDocumentId, fieldValues);
    } catch (prefillErr) {
      console.warn("[document-service] createDocumentPreview: prefill text fields failed", {
        signnowDocumentId,
        error: prefillErr instanceof Error ? prefillErr.message : String(prefillErr),
      });
    }
  }
  return signnowDocumentId;
}

/**
 * Send invites for an existing SignNow document (from preview) and save to DB.
 * Use when the user has previewed and then clicks Send.
 */
export async function sendDocumentFromPreview(
  entityType: "recruit" | "person",
  entityId: string,
  documentType: string,
  signnowDocumentId: string,
  userId: string
): Promise<string> {
  let entity: RecruitEntity | PersonEntity | null = null;
  if (entityType === "recruit") {
    const data = await getRecruitWithDetails(entityId);
    if (!data) throw new Error(`Recruit not found: ${entityId}`);
    entity = data;
  } else {
    const data = await getPersonWithDetails(entityId);
    if (!data) throw new Error(`Person not found: ${entityId}`);
    entity = data;
  }

  const templateConfig = await getTemplateConfigWithValidation(documentType);
  const templateEntity =
    entityType === "recruit"
      ? toRecruitTemplateEntity(entity as RecruitEntity)
      : toPersonTemplateEntity(entity as PersonEntity);
  const signers = await resolveSigners(templateConfig, templateEntity);
  const fieldValues = buildFieldValues(entity, documentType);

  if (fieldValues.length > 0) {
    try {
      await prefillTextFields(signnowDocumentId, fieldValues);
    } catch (prefillErr) {
      console.warn("[document-service] sendDocumentFromPreview: prefill text fields failed, continuing without pre-filled fields", {
        signnowDocumentId,
        error: prefillErr instanceof Error ? prefillErr.message : String(prefillErr),
      });
    }
  }

  const expirationDays = templateConfig.expirationDays ?? 30;
  const expiresAt = calculateExpirationDate(expirationDays);

  const docData = {
    ...(entityType === "recruit" ? { recruitId: entityId } : { personId: entityId }),
    documentType,
    signnowDocumentId,
    signnowTemplateId: templateConfig.signnowTemplateId ?? undefined,
    status: "pending" as const,
    totalSigners: signers.length,
    signedCount: 0,
    createdById: userId,
    expiresAt,
    metadata: {
      signers: signers.map((s) => ({ email: s.email, role: s.role })),
      templateDocumentType: documentType,
    },
  };

  const created = await createDocument(docData);
  const documentId = created.id;

  try {
    const inviteOptions = buildInviteOptions(templateConfig, documentType);
    await sendMultipleInvites(signnowDocumentId, signerInfoToConfig(signers), inviteOptions);
  } catch (inviteErr) {
    await deleteDocument(documentId);
    try {
      await voidSignNowDocument(signnowDocumentId);
    } catch (voidErr) {
      console.error("[document-service] sendDocumentFromPreview: failed to void after invite failure", {
        signnowDocumentId,
        voidError: voidErr instanceof Error ? voidErr.message : String(voidErr),
      });
    }
    throw inviteErr;
  }

  await updateDocumentStatus(documentId, "pending", { sentAt: new Date() });
  return documentId;
}

/**
 * Resend an expired document by voiding the old one and sending a new one.
 */
export async function resendDocument(documentId: string, userId: string): Promise<string> {
  try {
    const existing = await getDocumentWithDetails(documentId);
    if (!existing) {
      throw new Error(`Document not found: ${documentId}`);
    }

    const { document } = existing;
    const status = document.status ?? "pending";
    if (status === "signed" || status === "voided") {
      throw new Error(
        "Document cannot be resent: signed or voided documents cannot be resent. Only expired documents can be resent."
      );
    }

    const expiresAt = document.expiresAt;
    if (!expiresAt) {
      throw new Error("Document cannot be resent: no expiration date set.");
    }
    if (new Date(expiresAt) >= new Date()) {
      throw new Error(
        "Document cannot be resent: document has not expired yet. Only expired documents can be resent."
      );
    }

    const signnowDocumentId = document.signnowDocumentId;
    if (!signnowDocumentId) {
      throw new Error(
        "Document cannot be resent: no SignNow document ID. The document record cannot be voided in SignNow."
      );
    }

    await voidSignNowDocument(signnowDocumentId);
    await voidDocument(documentId);

    const entityType = document.recruitId ? "recruit" : "person";
    const entityId = document.recruitId ?? document.personId!;

    const newDocumentId = await sendDocument(
      entityType,
      entityId,
      document.documentType,
      userId
    );
    return newDocumentId;
  } catch (err) {
    console.error("[document-service] resendDocument failed", {
      documentId,
      userId,
      error: err instanceof Error ? err.message : String(err),
    });
    if (err instanceof Error) throw err;
    throw new Error(
      `Failed to resend document: ${err instanceof Error ? err.message : String(err)}`
    );
  }
}

/**
 * Get all expired documents the user is allowed to see, ordered by oldest expiration first.
 */
export async function getExpiredDocuments(userId: string): Promise<DocumentWithDetails[]> {
  try {
    const [userRow] = await db
      .select({
        id: people.id,
        officeId: people.officeId,
        roleId: people.roleId,
        roleName: roles.name,
        rolePermissions: roles.permissions,
      })
      .from(people)
      .innerJoin(roles, eq(people.roleId, roles.id))
      .where(eq(people.id, userId))
      .limit(1);

    if (!userRow) {
      return [];
    }

    const user: NonNullable<CurrentUser> = {
      id: userRow.id,
      officeId: userRow.officeId,
      roleName: userRow.roleName,
      rolePermissions:
        Array.isArray(userRow.rolePermissions) && userRow.rolePermissions.length > 0
          ? (userRow.rolePermissions as string[])
          : undefined,
    } as NonNullable<CurrentUser>;

    // Include: status "expired" (webhook-marked) or still pending/viewed/partially_signed but past expiration
    const baseConditions = and(
      inArray(documents.status, ["pending", "viewed", "partially_signed", "expired"]),
      lt(documents.expiresAt, new Date()),
      isNotNull(documents.expiresAt)
    );

    let whereClause: ReturnType<typeof and>;
    if (
      hasPermission(user, Permission.VIEW_ALL_PEOPLE) ||
      hasPermission(user, Permission.MANAGE_OWN_REGION)
    ) {
      whereClause = baseConditions;
    } else if (hasPermission(user, Permission.MANAGE_OWN_OFFICE) && user.officeId) {
      whereClause = and(
        baseConditions,
        or(
          eq(recruits.targetOfficeId, user.officeId),
          eq(documentPersonAlias.officeId, user.officeId)
        )
      )!;
    } else if (hasPermission(user, Permission.MANAGE_OWN_TEAM) && user.officeId) {
      whereClause = and(
        baseConditions,
        or(
          eq(recruits.targetOfficeId, user.officeId),
          eq(documentPersonAlias.officeId, user.officeId),
          eq(documentPersonAlias.reportsToId, userId)
        )
      )!;
    } else {
      whereClause = and(baseConditions, eq(documents.createdById, userId));
    }

    const rows = await db
      .select({
        document: documents,
        recruit: {
          id: recruits.id,
          firstName: recruits.firstName,
          lastName: recruits.lastName,
          email: recruits.email,
        },
        person: {
          id: documentPersonAlias.id,
          firstName: documentPersonAlias.firstName,
          lastName: documentPersonAlias.lastName,
          email: documentPersonAlias.email,
        },
        createdBy: {
          id: createdByAlias.id,
          firstName: createdByAlias.firstName,
          lastName: createdByAlias.lastName,
          email: createdByAlias.email,
        },
      })
      .from(documents)
      .leftJoin(recruits, eq(documents.recruitId, recruits.id))
      .leftJoin(documentPersonAlias, eq(documents.personId, documentPersonAlias.id))
      .leftJoin(createdByAlias, eq(documents.createdById, createdByAlias.id))
      .where(whereClause)
      .orderBy(asc(documents.expiresAt));

    return rows.map((row) => ({
      document: row.document,
      recruit: row.recruit?.id
        ? {
            id: row.recruit.id,
            firstName: row.recruit.firstName,
            lastName: row.recruit.lastName,
            email: row.recruit.email ?? "",
          }
        : null,
      person: row.person?.id
        ? {
            id: row.person.id,
            firstName: row.person.firstName,
            lastName: row.person.lastName,
            email: row.person.email,
          }
        : null,
      createdBy: row.createdBy?.id
        ? {
            id: row.createdBy.id,
            firstName: row.createdBy.firstName,
            lastName: row.createdBy.lastName,
            email: row.createdBy.email,
          }
        : null,
    }));
  } catch (err) {
    console.error("[document-service] getExpiredDocuments failed", {
      userId,
      error: err instanceof Error ? err.message : String(err),
    });
    throw err;
  }
}
