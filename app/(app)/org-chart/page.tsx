import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { offices } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { hasPermission } from "@/lib/auth/check-permission";
import { Permission } from "@/lib/permissions/types";
import { buildOrgTree } from "@/lib/db/helpers/org-chart-helpers";
import type { RelationshipType, ViewMode, PersonData } from "@/types/org-chart";
import { OrgChartControls } from "@/components/org-chart/org-chart-controls";
import { OrgTreeView } from "@/components/org-chart/org-tree-view";
import { OrgListView } from "@/components/org-chart/org-list-view";

export default async function OrgChartPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  // Check permissions
  const canViewAll = hasPermission(user, Permission.VIEW_ALL_PEOPLE);
  const canViewOffice = hasPermission(user, Permission.VIEW_OWN_OFFICE_PEOPLE);

  if (!canViewAll && !canViewOffice) {
    redirect("/dashboard");
  }

  // Extract search params
  const view = (searchParams.view as RelationshipType) || "reports_to";
  const office = searchParams.office as string | undefined;
  const search = searchParams.search as string | undefined;
  const mode = (searchParams.mode as ViewMode) || "tree";

  // Fetch offices for filter
  const officesList = await db
    .select({
      id: offices.id,
      name: offices.name,
    })
    .from(offices)
    .where(eq(offices.isActive, true))
    .orderBy(offices.name);

  // Build API URL with search params
  const apiParams = new URLSearchParams();
  if (view) apiParams.set("view", view);
  if (office) apiParams.set("office", office);
  if (search) apiParams.set("search", search);

  const apiUrl = `/api/org-chart?${apiParams.toString()}`;

  // Get headers to forward cookies and construct base URL
  const headersList = await headers();
  const cookieHeader = headersList.get("cookie");
  const host = headersList.get("host");
  const protocol = headersList.get("x-forwarded-proto") || "http";
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (host ? `${protocol}://${host}` : "http://localhost:3000");

  // Fetch people data from API endpoint
  const response = await fetch(`${baseUrl}${apiUrl}`, {
    headers: {
      ...(cookieHeader && { cookie: cookieHeader }),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch org chart data");
  }

  const peopleData: PersonData[] = await response.json();

  // Build tree structure if in tree mode
  let tree = null;
  if (mode === "tree") {
    tree = buildOrgTree(peopleData, view);
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Organization Chart</h2>
      </div>

      <div className="mb-6 rounded-lg bg-white p-6 shadow">
        <OrgChartControls offices={officesList} />
      </div>

      {mode === "tree" && tree ? (
        <OrgTreeView
          tree={tree}
          searchQuery={search}
          relationshipType={view}
        />
      ) : (
        <OrgListView people={peopleData} relationshipType={view} />
      )}
    </main>
  );
}
