import { redirect, notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getPersonWithDetails } from "@/lib/db/helpers/person-helpers";
import { PersonOverview } from "@/components/people/person-overview";
import { PersonTimeline } from "@/components/people/person-timeline";
import { PersonDeals } from "@/components/people/person-deals";
import { PersonCommissions } from "@/components/people/person-commissions";
import { PersonRecruits } from "@/components/people/person-recruits";
import { PersonActionMenu } from "@/components/people/person-action-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function PersonDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const personData = await getPersonWithDetails(id);

  if (!personData) {
    notFound();
  }

  const { person, role, office, manager, recruiter, currentTeams, currentPayPlan } = personData;

  function getStatusBadgeVariant(status: string | null) {
    switch (status) {
      case "active":
        return "default";
      case "onboarding":
        return "secondary";
      case "inactive":
        return "outline";
      case "terminated":
        return "destructive";
      default:
        return "outline";
    }
  }

  const initials = `${person.firstName?.[0] ?? ""}${person.lastName?.[0] ?? ""}`.toUpperCase();
  const fullName = `${person.firstName} ${person.lastName}`;

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/people" className="inline-flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to People
          </Link>
        </Button>
      </div>

      {/* Person Header */}
      <div className="mb-6 rounded-lg bg-white p-6 shadow">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={person.profileImageUrl ?? undefined} alt={fullName} />
              <AvatarFallback className="text-lg">{initials}</AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold">{fullName}</h2>
                <Badge variant={getStatusBadgeVariant(person.status ?? "active")}>
                  {person.status ?? "active"}
                </Badge>
              </div>
              <p className="mt-1 text-gray-600">{person.email}</p>
              {person.phone && <p className="text-sm text-gray-500">{person.phone}</p>}
              <div className="mt-2 flex gap-4 text-sm text-gray-600">
                {role && <span>Role: {role.name}</span>}
                {office && <span>Office: {office.name}</span>}
              </div>
            </div>
          </div>
          <PersonActionMenu personId={person.id} />
        </div>
      </div>

      {/* Tabs */}
      <div className="rounded-lg bg-white shadow">
        <Tabs defaultValue="overview" className="w-full">
          <div className="border-b px-6">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
              <TabsTrigger value="deals">Deals</TabsTrigger>
              <TabsTrigger value="commissions">Commissions</TabsTrigger>
              <TabsTrigger value="recruits">Recruits</TabsTrigger>
            </TabsList>
          </div>
          <div className="p-6">
            <TabsContent value="overview">
              <PersonOverview
                person={person}
                role={role}
                office={office}
                manager={manager}
                recruiter={recruiter}
                currentTeams={currentTeams}
                currentPayPlan={currentPayPlan}
              />
            </TabsContent>
            <TabsContent value="timeline">
              <PersonTimeline personId={person.id} />
            </TabsContent>
            <TabsContent value="deals">
              <PersonDeals personId={person.id} />
            </TabsContent>
            <TabsContent value="commissions">
              <PersonCommissions personId={person.id} />
            </TabsContent>
            <TabsContent value="recruits">
              <PersonRecruits personId={person.id} />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </main>
  );
}
