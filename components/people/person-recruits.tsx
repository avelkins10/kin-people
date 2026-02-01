"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { RecruitDetailModal } from "@/components/recruiting/modals/recruit-detail-modal";
import type { RecruitListItem } from "@/types/recruiting";

interface PersonRecruitsProps {
  personId: string;
}

function getStatusBadgeVariant(status: string) {
  switch (status) {
    case "lead":
      return "outline";
    case "contacted":
      return "secondary";
    case "interviewing":
      return "default";
    case "offer_sent":
      return "default";
    case "agreement_sent":
      return "default";
    case "agreement_signed":
      return "default";
    case "onboarding":
      return "secondary";
    case "converted":
      return "default";
    case "rejected":
      return "destructive";
    case "dropped":
      return "outline";
    default:
      return "outline";
  }
}

export function PersonRecruits({ personId }: PersonRecruitsProps) {
  const [recruits, setRecruits] = useState<RecruitListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecruit, setSelectedRecruit] =
    useState<RecruitListItem | null>(null);

  useEffect(() => {
    fetchRecruits();
  }, [personId]);

  async function fetchRecruits() {
    try {
      setLoading(true);
      const response = await fetch(`/api/recruits?recruiterId=${personId}`);
      if (response.ok) {
        const data = await response.json();
        setRecruits(data);
      }
    } catch (error) {
      console.error("Error fetching recruits:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="text-center text-gray-500 py-8">Loading recruits...</div>
    );
  }

  if (recruits.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        <p>No recruits found for this person.</p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-lg bg-white shadow">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Target Office</TableHead>
              <TableHead>Target Role</TableHead>
              <TableHead>Created Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recruits.map((item) => {
              const recruit = item.recruit;
              return (
                <TableRow
                  key={recruit.id}
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => setSelectedRecruit(item)}
                >
                  <TableCell className="font-medium">
                    {recruit.firstName} {recruit.lastName}
                  </TableCell>
                  <TableCell>{recruit.email || "-"}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(recruit.status)}>
                      {recruit.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{item.targetOffice?.name || "-"}</TableCell>
                  <TableCell>{item.targetRole?.name || "-"}</TableCell>
                  <TableCell>
                    {recruit.createdAt
                      ? new Date(recruit.createdAt).toLocaleDateString()
                      : "-"}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {selectedRecruit && (
        <RecruitDetailModal
          recruitId={selectedRecruit.recruit.id}
          open={!!selectedRecruit}
          onClose={() => setSelectedRecruit(null)}
        />
      )}
    </>
  );
}
