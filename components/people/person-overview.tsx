"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import type { PersonWithDetails } from "@/types/people";
import { PersonAppAccess } from "./person-app-access";

function formatDate(date: Date | string | null): string {
  if (!date) return "-";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

interface LeadershipAssignment {
  id: string;
  roleType: string;
  officeId: string | null;
  officeName: string | null;
  region: string | null;
  division: string | null;
  effectiveFrom: string | null;
  effectiveTo: string | null;
}

interface PersonOverviewProps {
  person: PersonWithDetails["person"];
  role: PersonWithDetails["role"];
  office: PersonWithDetails["office"];
  manager: PersonWithDetails["manager"];
  recruiter: PersonWithDetails["recruiter"];
  currentTeams: PersonWithDetails["currentTeams"];
  currentPayPlan: PersonWithDetails["currentPayPlan"];
  personId?: string;
}

export function PersonOverview({
  person,
  role,
  office,
  manager,
  recruiter,
  currentTeams,
  currentPayPlan,
  personId,
}: PersonOverviewProps) {
  const [leadership, setLeadership] = useState<LeadershipAssignment[]>([]);

  useEffect(() => {
    if (!personId) return;
    let cancelled = false;
    fetch(`/api/people/${personId}/leadership`)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("Failed to load"))))
      .then((data: { leadership: LeadershipAssignment[] }) => {
        if (!cancelled) setLeadership(data.leadership ?? []);
      })
      .catch(() => {
        if (!cancelled) setLeadership([]);
      });
    return () => {
      cancelled = true;
    };
  }, [personId]);

  const leadershipLabel = (a: LeadershipAssignment): string => {
    if (a.roleType === "ad" && a.officeName) return `AD of ${a.officeName}`;
    if (a.roleType === "regional" && a.region) return `Regional for ${a.region}`;
    if (a.roleType === "divisional" && a.division) return `Divisional for ${a.division}`;
    if (a.roleType === "vp") return a.division ? `VP for ${a.division}` : "VP (company)";
    return a.roleType;
  };

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      {/* Current Position */}
      <Card>
        <CardHeader>
          <CardTitle>Current Position</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-sm font-medium text-gray-500">Role</p>
            <p className="text-base">{role?.name || "-"}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Office</p>
            <p className="text-base">{office?.name || "-"}</p>
          </div>
          {manager && (
            <div>
              <p className="text-sm font-medium text-gray-500">Manager</p>
              <Link
                href={`/people/${manager.id}`}
                className="text-base text-blue-600 hover:underline"
              >
                {manager.firstName} {manager.lastName}
              </Link>
            </div>
          )}
          {recruiter && (
            <div>
              <p className="text-sm font-medium text-gray-500">Recruited By</p>
              <Link
                href={`/people/${recruiter.id}`}
                className="text-base text-blue-600 hover:underline"
              >
                {recruiter.firstName} {recruiter.lastName}
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Compensation */}
      <Card>
        <CardHeader>
          <CardTitle>Compensation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {currentPayPlan ? (
            <>
              <div>
                <p className="text-sm font-medium text-gray-500">Pay Plan</p>
                <p className="text-base">{currentPayPlan.payPlan.name}</p>
              </div>
              {currentPayPlan.effectiveDate && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Effective Since</p>
                  <p className="text-base">
                    {formatDate(currentPayPlan.effectiveDate)}
                  </p>
                </div>
              )}
              {currentPayPlan.notes && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Notes</p>
                  <p className="text-base text-sm">{currentPayPlan.notes}</p>
                </div>
              )}
            </>
          ) : (
            <p className="text-gray-500">No pay plan assigned</p>
          )}
        </CardContent>
      </Card>

      {/* Leadership */}
      {leadership.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Leadership</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {leadership.map((a) => (
                <li key={a.id} className="text-base">
                  {leadershipLabel(a)}
                  {(a.effectiveFrom || a.effectiveTo) && (
                    <span className="text-sm text-gray-500 ml-1">
                      {a.effectiveFrom && `(from ${formatDate(a.effectiveFrom)})`}
                      {a.effectiveTo && ` – ${formatDate(a.effectiveTo)}`}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Teams */}
      <Card>
        <CardHeader>
          <CardTitle>Teams</CardTitle>
        </CardHeader>
        <CardContent>
          {currentTeams.length > 0 ? (
            <ul className="space-y-2">
              {currentTeams.map((team) => (
                <li key={team.team.id} className="flex items-center justify-between">
                  <span className="text-base">{team.team.name}</span>
                  <span className="text-sm text-gray-500 capitalize">
                    {team.roleInTeam}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">Not assigned to any teams</p>
          )}
        </CardContent>
      </Card>

      {/* Employment */}
      <Card>
        <CardHeader>
          <CardTitle>Employment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {person.hireDate && (
            <div>
              <p className="text-sm font-medium text-gray-500">Hire Date</p>
              <p className="text-base">
                {formatDate(person.hireDate)}
              </p>
            </div>
          )}
          <div>
            <p className="text-sm font-medium text-gray-500">Status</p>
            <p className="text-base capitalize">{person.status || "active"}</p>
          </div>
          {person.terminationDate && (
            <div>
              <p className="text-sm font-medium text-gray-500">Termination Date</p>
              <p className="text-base">
                {formatDate(person.terminationDate)}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* App Access */}
      {personId && <PersonAppAccess personId={personId} />}
    </div>
  );
}
