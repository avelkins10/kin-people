"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PersonOverview } from "@/components/people/person-overview";
import { PersonDeals } from "@/components/people/person-deals";
import { PersonCommissions } from "@/components/people/person-commissions";
import { PersonDocuments } from "@/components/people/person-documents";
import { PersonRecruits } from "@/components/people/person-recruits";
import type { PersonWithDetails } from "@/types/people";
import { ArrowLeft, Loader2 } from "lucide-react";

export default function PersonDetailPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const [data, setData] = useState<PersonWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(`/api/people/${id}`)
      .then((res) => {
        if (!res.ok) {
          if (res.status === 404) throw new Error("Person not found");
          throw new Error(res.statusText || "Failed to load person");
        }
        return res.json();
      })
      .then((json) => {
        if (!cancelled) setData(json);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load person");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (!id) {
    return (
      <div className="p-8 text-gray-500">
        <p>Invalid person ID.</p>
        <Button variant="outline" className="mt-4" asChild>
          <Link href="/people">Back to People</Link>
        </Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-gray-500" aria-busy="true">
        <Loader2 className="w-8 h-8 animate-spin mr-2" />
        Loading…
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8">
        <p className="text-red-600 mb-4">{error ?? "Person not found"}</p>
        <Button variant="outline" asChild>
          <Link href="/people">Back to People</Link>
        </Button>
      </div>
    );
  }

  const { person, role, office, manager, recruiter, currentTeams, currentPayPlan } = data;
  const displayName = [person.firstName, person.lastName].filter(Boolean).join(" ") || "Person";

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild aria-label="Back to people">
            <Link href="/people">
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-black text-white flex items-center justify-center text-lg font-bold shrink-0">
              {displayName
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)}
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-black uppercase">
                {displayName}
              </h1>
              <p className="text-sm text-gray-500">
                {role?.name ?? "—"} {office?.name ? `· ${office.name}` : ""}
              </p>
            </div>
          </div>
        </div>
      </header>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="bg-gray-100 border border-gray-200">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="deals">Deals</TabsTrigger>
          <TabsTrigger value="commissions">Commissions</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="recruits">Recruits</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-4">
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
        <TabsContent value="deals">
          <PersonDeals personId={id} />
        </TabsContent>
        <TabsContent value="commissions">
          <PersonCommissions personId={id} />
        </TabsContent>
        <TabsContent value="documents">
          <PersonDocuments personId={id} />
        </TabsContent>
        <TabsContent value="recruits">
          <PersonRecruits personId={id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
