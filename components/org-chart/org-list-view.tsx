"use client";

import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import type { PersonData, RelationshipType } from "@/types/org-chart";
import { OrgNodeQuickActions } from "./org-node-quick-actions";

interface OrgListViewProps {
  people: PersonData[];
  relationshipType: RelationshipType;
}

export function OrgListView({ people, relationshipType }: OrgListViewProps) {
  const router = useRouter();

  // Create a map for quick lookups
  const peopleMap = new Map<string, PersonData>();
  people.forEach((person) => {
    peopleMap.set(person.id, person);
  });

  function getRelationshipName(person: PersonData): string {
    const relationshipId =
      relationshipType === "reports_to"
        ? person.reportsToId
        : person.recruitedById;

    if (!relationshipId) return "-";

    const relatedPerson = peopleMap.get(relationshipId);
    if (!relatedPerson) return "-";

    return `${relatedPerson.firstName} ${relatedPerson.lastName}`;
  }

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

  const relationshipLabel =
    relationshipType === "reports_to" ? "Manager" : "Recruiter";

  if (people.length === 0) {
    return (
      <div className="rounded-lg bg-white p-12 text-center shadow">
        <p className="text-gray-500">No people found</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-white shadow">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Office</TableHead>
            <TableHead>{relationshipLabel}</TableHead>
            <TableHead>Reports</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {people.map((person) => (
            <TableRow
              key={person.id}
              className="cursor-pointer hover:bg-gray-50"
              onClick={() => router.push(`/people/${person.id}`)}
            >
              <TableCell>
                <Link
                  href={`/people/${person.id}`}
                  className="font-medium hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  {person.firstName} {person.lastName}
                </Link>
              </TableCell>
              <TableCell>{person.email}</TableCell>
              <TableCell>
                {person.roleName || "-"}
                {person.roleLevel && (
                  <span className="text-gray-400 text-xs ml-1">(L{person.roleLevel})</span>
                )}
              </TableCell>
              <TableCell>{person.officeName || "-"}</TableCell>
              <TableCell>{getRelationshipName(person)}</TableCell>
              <TableCell>
                {person.directReportCount > 0 ? (
                  <Badge variant="outline" className="text-xs">
                    {person.directReportCount}
                  </Badge>
                ) : (
                  "-"
                )}
              </TableCell>
              <TableCell>
                <Badge variant={getStatusBadgeVariant(person.status)}>
                  {person.status || "active"}
                </Badge>
              </TableCell>
              <TableCell onClick={(e) => e.stopPropagation()}>
                <OrgNodeQuickActions
                  personId={person.id}
                  personName={`${person.firstName} ${person.lastName}`}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
