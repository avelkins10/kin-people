import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { hasPermission } from "@/lib/auth/check-permission";
import { Permission } from "@/lib/permissions/types";
import { RecruitingKanban } from "@/components/recruiting/recruiting-kanban";
import { RecruitingTable } from "@/components/recruiting/recruiting-table";
import { AddRecruitModal } from "@/components/recruiting/modals/add-recruit-modal";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { headers } from "next/headers";

export default async function RecruitingPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  // Check if user has permission to view recruits
  const canViewAll = hasPermission(user, Permission.VIEW_ALL_PEOPLE);
  const canViewOffice = hasPermission(user, Permission.VIEW_OWN_OFFICE_PEOPLE);
  const canCreate = hasPermission(user, Permission.CREATE_RECRUITS);

  if (!canViewAll && !canViewOffice) {
    redirect("/dashboard");
  }

  // Get view mode from search params
  const view = (searchParams.view as string) || "kanban";

  // Get headers to forward cookies and construct base URL
  const headersList = await headers();
  const cookieHeader = headersList.get("cookie");
  const host = headersList.get("host");
  const protocol = headersList.get("x-forwarded-proto") || "http";
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    (host ? `${protocol}://${host}` : "http://localhost:3000");

  // Fetch recruits data from API endpoint
  const apiParams = new URLSearchParams();
  if (searchParams.status) {
    apiParams.set("status", searchParams.status as string);
  }
  if (searchParams.recruiterId) {
    apiParams.set("recruiterId", searchParams.recruiterId as string);
  }
  if (searchParams.officeId) {
    apiParams.set("officeId", searchParams.officeId as string);
  }

  const apiUrl = `/api/recruits?${apiParams.toString()}`;

  const response = await fetch(`${baseUrl}${apiUrl}`, {
    headers: {
      ...(cookieHeader && { cookie: cookieHeader }),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch recruits data");
  }

  const recruitsData = await response.json();

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Recruiting</h1>
          <p className="text-sm text-gray-600 mt-1">
            Manage your recruiting pipeline
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 border border-gray-300 rounded-md">
            <Button
              variant={view === "kanban" ? "default" : "ghost"}
              size="sm"
              asChild
            >
              <a href="?view=kanban">Kanban</a>
            </Button>
            <Button
              variant={view === "table" ? "default" : "ghost"}
              size="sm"
              asChild
            >
              <a href="?view=table">Table</a>
            </Button>
          </div>
          {canCreate && (
            <AddRecruitModal>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Recruit
              </Button>
            </AddRecruitModal>
          )}
        </div>
      </div>

      {view === "kanban" ? (
        <RecruitingKanban initialRecruits={recruitsData} />
      ) : (
        <RecruitingTable initialRecruits={recruitsData} />
      )}
    </main>
  );
}
