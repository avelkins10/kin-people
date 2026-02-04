import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/route-protection";
import {
  getTemplateCopies,
  type GetTemplateCopiesOptions,
  type TemplateCopySigningStatus,
} from "@/lib/integrations/signnow";

/**
 * GET /api/signnow/templates/[templateId]/copies
 * Returns documents created from a SignNow template.
 * Query params: sort_by, sort_order, per_page, page, signing_status
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ templateId: string }> }
) {
  const { templateId } = await params;
  if (!templateId) {
    return NextResponse.json({ error: "templateId is required" }, { status: 400 });
  }
  return withAuth(async (req: NextRequest, _user) => {
    try {
      const { searchParams } = new URL(req.url);
      const sortBy = searchParams.get("sort_by");
      const sortOrder = searchParams.get("sort_order");
      const perPage = searchParams.get("per_page");
      const page = searchParams.get("page");
      const signingStatus = searchParams.get("signing_status") as TemplateCopySigningStatus | null;
      const exclude = searchParams.get("exclude");
      const searchBy = searchParams.get("search_by");
      const searchKey = searchParams.get("search_key");

      const options: GetTemplateCopiesOptions = {};
      if (sortBy && ["updated", "created", "document_name"].includes(sortBy)) {
        options.sort_by = sortBy as GetTemplateCopiesOptions["sort_by"];
      }
      if (sortOrder && ["asc", "desc"].includes(sortOrder)) {
        options.sort_order = sortOrder as "asc" | "desc";
      }
      if (perPage != null) {
        const n = parseInt(perPage, 10);
        if (!Number.isNaN(n) && n > 0) options.per_page = n;
      }
      if (page != null) {
        const n = parseInt(page, 10);
        if (!Number.isNaN(n) && n >= 1) options.page = n;
      }
      if (signingStatus) {
        const valid: TemplateCopySigningStatus[] = [
          "waiting-for-me",
          "waiting-for-others",
          "signed",
          "pending",
          "has-invites",
          "expired",
        ];
        if (valid.includes(signingStatus)) options.filters = { ...options.filters, signing_status: signingStatus };
      }
      if (exclude === "doc-from-dg") options.exclude = "doc-from-dg";
      if (searchBy) options.search_by = searchBy as GetTemplateCopiesOptions["search_by"];
      if (searchKey) options.search_key = searchKey;

      const result = await getTemplateCopies(templateId, options);
      return NextResponse.json(result);
    } catch (error: unknown) {
      console.error("Error fetching SignNow template copies:", error);
      const message = error instanceof Error ? error.message : "Failed to fetch template copies";
      return NextResponse.json({ error: message }, { status: 500 });
    }
  })(req);
}
