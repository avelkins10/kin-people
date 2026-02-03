import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { documents, recruits, people } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { withAuth } from "@/lib/auth/route-protection";
import { canViewDocument } from "@/lib/auth/visibility-rules";
import {
  getDocumentsByRecruit,
  getDocumentsByPerson,
  type DocumentWithDetails,
} from "@/lib/db/helpers/document-helpers";

const listDocumentsSchema = z.object({
  recruitId: z.string().uuid().optional(),
  personId: z.string().uuid().optional(),
  status: z.string().optional(),
  documentType: z.string().optional(),
  limit: z.string().optional(),
});

const createdByPerson = alias(people, "created_by");

async function listDocumentsWithFilters(
  filters: {
    status?: string;
    documentType?: string;
    limit?: number;
  }
): Promise<DocumentWithDetails[]> {
  const conditions: ReturnType<typeof eq>[] = [];
  if (filters.status) {
    conditions.push(eq(documents.status, filters.status));
  }
  if (filters.documentType) {
    conditions.push(eq(documents.documentType, filters.documentType));
  }

  let query = db
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
    .leftJoin(createdByPerson, eq(documents.createdById, createdByPerson.id));

  if (conditions.length > 0) {
    query = query.where(and(...conditions));
  }
  const rows = await query
    .orderBy(desc(documents.createdAt))
    .limit(filters.limit ?? 100);

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
}

export const GET = withAuth(async (req: NextRequest, user) => {
  try {
    const { searchParams } = new URL(req.url);
    const parsed = listDocumentsSchema.safeParse({
      recruitId: searchParams.get("recruitId") ?? undefined,
      personId: searchParams.get("personId") ?? undefined,
      status: searchParams.get("status") ?? undefined,
      documentType: searchParams.get("documentType") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: parsed.error.errors },
        { status: 400 }
      );
    }

    const { recruitId, personId, status, documentType, limit } = parsed.data;
    const limitNum = limit
      ? Math.min(Math.max(1, parseInt(limit, 10)), 100)
      : 100;

    if (recruitId && personId) {
      return NextResponse.json(
        {
          error:
            "Provide only recruitId or personId; combined entity filters are not supported",
        },
        { status: 400 }
      );
    }

    const entityFilters =
      status !== undefined || documentType !== undefined
        ? { status, documentType }
        : undefined;

    let list: DocumentWithDetails[];

    if (recruitId) {
      list = await getDocumentsByRecruit(recruitId, entityFilters);
    } else if (personId) {
      list = await getDocumentsByPerson(personId, entityFilters);
    } else {
      list = await listDocumentsWithFilters({
        status,
        documentType,
        limit: limitNum,
      });
    }

    const filtered: DocumentWithDetails[] = [];
    for (const item of list) {
      const allowed = await canViewDocument(user, item.document.id);
      if (allowed) {
        filtered.push(item);
      }
    }

    const result = filtered.slice(0, limitNum);
    return NextResponse.json(result);
  } catch (error) {
    console.error("[api/documents] GET failed", error);
    return NextResponse.json(
      { error: "Failed to list documents" },
      { status: 500 }
    );
  }
});
