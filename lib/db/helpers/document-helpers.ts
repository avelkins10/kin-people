import { db } from "@/lib/db";
import { documents, recruits, people } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import type { Document, NewDocument } from "@/lib/db/schema/documents";

const createdByPerson = alias(people, "created_by");

export interface DocumentWithDetails {
  document: Document;
  recruit: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  person: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  createdBy: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
}

/**
 * Create a new document with defaults for status, signedCount, and metadata.
 */
export async function createDocument(
  data: Omit<NewDocument, "id" | "createdAt" | "updatedAt">
): Promise<Document> {
  const [inserted] = await db
    .insert(documents)
    .values({
      ...data,
      status: data.status ?? "pending",
      signedCount: data.signedCount ?? 0,
      metadata: data.metadata ?? {},
    })
    .returning();
  if (!inserted) {
    throw new Error("Failed to create document");
  }
  return inserted;
}

export interface DocumentListFilters {
  status?: string;
  documentType?: string;
}

/**
 * Fetch all documents for a recruit with related details.
 * Optionally filter by status and/or documentType.
 */
export async function getDocumentsByRecruit(
  recruitId: string,
  filters?: DocumentListFilters
): Promise<DocumentWithDetails[]> {
  const conditions = [eq(documents.recruitId, recruitId)];
  if (filters?.status) {
    conditions.push(eq(documents.status, filters.status));
  }
  if (filters?.documentType) {
    conditions.push(eq(documents.documentType, filters.documentType));
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
      createdBy: {
        id: createdByPerson.id,
        firstName: createdByPerson.firstName,
        lastName: createdByPerson.lastName,
        email: createdByPerson.email,
      },
    })
    .from(documents)
    .leftJoin(recruits, eq(documents.recruitId, recruits.id))
    .leftJoin(createdByPerson, eq(documents.createdById, createdByPerson.id))
    .where(and(...conditions))
    .orderBy(desc(documents.createdAt));

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
    person: null,
    createdBy: row.createdBy?.id
      ? {
          id: row.createdBy.id,
          firstName: row.createdBy.firstName,
          lastName: row.createdBy.lastName,
          email: row.createdBy.email,
        }
      : null,
  }));
}

/**
 * Fetch all documents for a person with related details.
 * Optionally filter by status and/or documentType.
 */
export async function getDocumentsByPerson(
  personId: string,
  filters?: DocumentListFilters
): Promise<DocumentWithDetails[]> {
  const conditions = [eq(documents.personId, personId)];
  if (filters?.status) {
    conditions.push(eq(documents.status, filters.status));
  }
  if (filters?.documentType) {
    conditions.push(eq(documents.documentType, filters.documentType));
  }
  const rows = await db
    .select({
      document: documents,
      person: {
        id: people.id,
        firstName: people.firstName,
        lastName: people.lastName,
        email: people.email,
      },
      createdBy: {
        id: createdByPerson.id,
        firstName: createdByPerson.firstName,
        lastName: createdByPerson.lastName,
        email: createdByPerson.email,
      },
    })
    .from(documents)
    .leftJoin(people, eq(documents.personId, people.id))
    .leftJoin(createdByPerson, eq(documents.createdById, createdByPerson.id))
    .where(and(...conditions))
    .orderBy(desc(documents.createdAt));

  return rows.map((row) => ({
    document: row.document,
    recruit: null,
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
}

/**
 * Update document status and optional timestamps (e.g. from SignNow webhook).
 */
export async function updateDocumentStatus(
  documentId: string,
  status: string,
  timestamps: {
    sentAt?: Date;
    viewedAt?: Date;
    signedAt?: Date;
    voidedAt?: Date;
    expiresAt?: Date;
  } = {}
): Promise<Document> {
  const update: Partial<Document> = {
    status,
    updatedAt: new Date(),
    ...(timestamps.sentAt !== undefined && { sentAt: timestamps.sentAt }),
    ...(timestamps.viewedAt !== undefined && { viewedAt: timestamps.viewedAt }),
    ...(timestamps.signedAt !== undefined && { signedAt: timestamps.signedAt }),
    ...(timestamps.voidedAt !== undefined && { voidedAt: timestamps.voidedAt }),
    ...(timestamps.expiresAt !== undefined && { expiresAt: timestamps.expiresAt }),
  };
  if (status === "signed" && timestamps.signedAt === undefined && !update.signedAt) {
    update.signedAt = new Date();
  }
  if (status === "voided" && timestamps.voidedAt === undefined && !update.voidedAt) {
    update.voidedAt = new Date();
  }

  const [updated] = await db
    .update(documents)
    .set(update)
    .where(eq(documents.id, documentId))
    .returning();
  if (!updated) {
    throw new Error("Document not found or update failed");
  }
  return updated;
}

/**
 * Delete a document record by ID (e.g. when compensating after failed invite send).
 */
export async function deleteDocument(documentId: string): Promise<void> {
  await db.delete(documents).where(eq(documents.id, documentId));
}

/**
 * Void a document (e.g. when resending expired document).
 */
export async function voidDocument(documentId: string): Promise<Document> {
  const [updated] = await db
    .update(documents)
    .set({
      status: "voided",
      voidedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(documents.id, documentId))
    .returning();
  if (!updated) {
    throw new Error("Document not found or update failed");
  }
  return updated;
}

/**
 * Fetch a single document by SignNow document ID with all related details.
 */
export async function getDocumentBySignnowId(
  signnowDocumentId: string
): Promise<DocumentWithDetails | null> {
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
        id: people.id,
        firstName: people.firstName,
        lastName: people.lastName,
        email: people.email,
      },
      createdBy: {
        id: createdByPerson.id,
        firstName: createdByPerson.firstName,
        lastName: createdByPerson.lastName,
        email: createdByPerson.email,
      },
    })
    .from(documents)
    .leftJoin(recruits, eq(documents.recruitId, recruits.id))
    .leftJoin(people, eq(documents.personId, people.id))
    .leftJoin(createdByPerson, eq(documents.createdById, createdByPerson.id))
    .where(eq(documents.signnowDocumentId, signnowDocumentId))
    .limit(1);

  const row = rows[0];
  if (!row) {
    return null;
  }

  return {
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
  };
}

/**
 * Fetch a single document by ID with all related details.
 */
export async function getDocumentWithDetails(
  documentId: string
): Promise<DocumentWithDetails | null> {
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
        id: people.id,
        firstName: people.firstName,
        lastName: people.lastName,
        email: people.email,
      },
      createdBy: {
        id: createdByPerson.id,
        firstName: createdByPerson.firstName,
        lastName: createdByPerson.lastName,
        email: createdByPerson.email,
      },
    })
    .from(documents)
    .leftJoin(recruits, eq(documents.recruitId, recruits.id))
    .leftJoin(people, eq(documents.personId, people.id))
    .leftJoin(createdByPerson, eq(documents.createdById, createdByPerson.id))
    .where(eq(documents.id, documentId))
    .limit(1);

  const row = rows[0];
  if (!row) {
    return null;
  }

  return {
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
  };
}
