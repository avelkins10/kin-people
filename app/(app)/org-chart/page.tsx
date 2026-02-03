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
import Link from "next/link";
import { Download, GitBranch, List, Network, Search, X, Filter } from "lucide-react";

export default async function OrgChartPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const canViewAll = hasPermission(user, Permission.VIEW_ALL_PEOPLE);
  const canViewOffice = hasPermission(user, Permission.VIEW_OWN_OFFICE_PEOPLE);

  if (!canViewAll && !canViewOffice) {
    redirect("/dashboard");
  }

  const view = (searchParams.view as RelationshipType) || "reports_to";
  const office = searchParams.office as string | undefined;
  const search = searchParams.search as string | undefined;
  const mode = (searchParams.mode as ViewMode) || "tree";

  const officesList = await db
    .select({
      id: offices.id,
      name: offices.name,
    })
    .from(offices)
    .where(eq(offices.isActive, true))
    .orderBy(offices.name);

  const apiParams = new URLSearchParams();
  if (view) apiParams.set("view", view);
  if (office) apiParams.set("office", office);
  if (search) apiParams.set("search", search);

  const apiUrl = `/api/org-chart?${apiParams.toString()}`;

  const headersList = await headers();
  const cookieHeader = headersList.get("cookie");
  const host = headersList.get("host");
  const protocol = headersList.get("x-forwarded-proto") || "http";
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    (host ? `${protocol}://${host}` : "http://localhost:3000");

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

  let tree = null;
  if (mode === "tree") {
    tree = buildOrgTree(peopleData, view);
  }

  // Count totals by office
  const totalPeople = peopleData.length;

  return (
    <>
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tighter text-black mb-1 uppercase">
            Org Chart
          </h1>
          <p className="text-gray-500 font-medium">
            Visualize your team structure and reporting relationships.
          </p>
        </div>
        <div className="flex gap-3">
          <button className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-sm text-sm font-bold hover:bg-gray-50 transition-colors">
            <Download className="w-4 h-4" /> Export PDF
          </button>
        </div>
      </header>

      {/* Stats Bar */}
      <div className="bg-[#0a0a0a] text-white p-4 rounded-sm flex items-center justify-between mb-8">
        <div className="flex items-center gap-8">
          <div>
            <span className="text-2xl font-extrabold">{totalPeople}</span>
            <span className="text-xs text-gray-400 uppercase ml-2">
              Total People
            </span>
          </div>
          <div className="h-8 w-px bg-gray-700" />
          <div>
            <span className="text-2xl font-extrabold">{officesList.length}</span>
            <span className="text-xs text-gray-400 uppercase ml-2">Offices</span>
          </div>
          <div className="h-8 w-px bg-gray-700" />
          <div>
            <span className="text-2xl font-extrabold">4</span>
            <span className="text-xs text-gray-400 uppercase ml-2">
              Departments
            </span>
          </div>
        </div>
        <div className="text-xs text-gray-400">
          Viewing:{" "}
          <span className="text-white font-bold uppercase">
            {view.replace(/_/g, " ")} Hierarchy
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-gray-500 flex items-center gap-2">
            <Filter className="w-4 h-4" />
            FILTERS
          </span>
          <select
            className="px-3 py-2 border border-gray-200 rounded-sm text-sm font-medium bg-white"
            defaultValue={office || ""}
          >
            <option value="">OFFICE: ALL</option>
            {officesList.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
          <select
            className="px-3 py-2 border border-gray-200 rounded-sm text-sm font-medium bg-white"
            defaultValue={view}
          >
            <option value="reports_to">VIEW: REPORTS TO</option>
            <option value="trained_by">VIEW: TRAINED BY</option>
          </select>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="search"
              placeholder="Search people..."
              defaultValue={search || ""}
              className="pl-9 pr-4 py-2 border border-gray-200 rounded-sm text-sm font-medium bg-white w-48"
            />
          </div>
          <button className="text-xs font-bold text-gray-400 hover:text-gray-600 flex items-center gap-1">
            <X className="w-3 h-3" /> CLEAR
          </button>
        </div>

        <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-sm">
          <Link
            href={`?mode=tree&view=${view}${office ? `&office=${office}` : ""}${search ? `&search=${search}` : ""}`}
            className={`px-3 py-1.5 rounded-sm text-sm font-bold flex items-center gap-2 transition-colors ${
              mode === "tree"
                ? "bg-black text-white"
                : "text-gray-600 hover:text-black"
            }`}
          >
            <Network className="w-4 h-4" /> TREE
          </Link>
          <Link
            href={`?mode=list&view=${view}${office ? `&office=${office}` : ""}${search ? `&search=${search}` : ""}`}
            className={`px-3 py-1.5 rounded-sm text-sm font-bold flex items-center gap-2 transition-colors ${
              mode === "list"
                ? "bg-black text-white"
                : "text-gray-600 hover:text-black"
            }`}
          >
            <List className="w-4 h-4" /> LIST
          </Link>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white border border-gray-100 rounded-sm p-6 min-h-[500px]">
        {mode === "tree" && tree ? (
          <OrgTreeView
            tree={tree}
            searchQuery={search}
            relationshipType={view}
          />
        ) : (
          <OrgListView people={peopleData} relationshipType={view} />
        )}
      </div>
    </>
  );
}
