"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RecruitDetailModal } from "@/components/recruiting/modals/recruit-detail-modal";
import type { RecruitListItem } from "@/types/recruiting";
import { useRouter, useSearchParams } from "next/navigation";

interface RecruitingTableProps {
  initialRecruits: RecruitListItem[];
}

const STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "lead", label: "Lead" },
  { value: "contacted", label: "Contacted" },
  { value: "interviewing", label: "Interviewing" },
  { value: "offer_sent", label: "Offer Sent" },
  { value: "agreement_sent", label: "Agreement Sent" },
  { value: "agreement_signed", label: "Agreement Signed" },
  { value: "onboarding", label: "Onboarding" },
  { value: "converted", label: "Converted" },
  { value: "rejected", label: "Rejected" },
  { value: "dropped", label: "Dropped" },
];

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

export function RecruitingTable({ initialRecruits }: RecruitingTableProps) {
  const [recruits] = useState<RecruitListItem[]>(initialRecruits);
  const [selectedRecruit, setSelectedRecruit] =
    useState<RecruitListItem | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();

  const statusFilter = searchParams.get("status") || "";

  // Filter recruits
  const filteredRecruits = recruits.filter((item) => {
    const recruit = item.recruit;
    const matchesStatus = !statusFilter || recruit.status === statusFilter;
    const matchesSearch =
      !searchQuery ||
      `${recruit.firstName} ${recruit.lastName}`
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      recruit.email?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const handleStatusFilterChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set("status", value);
    } else {
      params.delete("status");
    }
    router.push(`?${params.toString()}`);
  };

  return (
    <>
      <div className="mb-6 rounded-lg bg-white p-4 shadow">
        <div className="flex gap-4">
          <Input
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-sm"
          />
          <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-lg bg-white shadow">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Target Office</TableHead>
              <TableHead>Target Role</TableHead>
              <TableHead>Recruiter</TableHead>
              <TableHead>Created Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRecruits.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-gray-500">
                  No recruits found
                </TableCell>
              </TableRow>
            ) : (
              filteredRecruits.map((item) => {
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
                      <Badge variant={getStatusBadgeVariant(recruit.status ?? "unknown")}>
                        {recruit.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {item.targetOffice?.name || "-"}
                    </TableCell>
                    <TableCell>{item.targetRole?.name || "-"}</TableCell>
                    <TableCell>
                      {item.recruiter
                        ? `${item.recruiter.firstName} ${item.recruiter.lastName}`
                        : "-"}
                    </TableCell>
                    <TableCell>
                      {recruit.createdAt
                        ? new Date(recruit.createdAt).toLocaleDateString()
                        : "-"}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
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
