"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function CommissionsFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const status = searchParams.get("status") || "";
  const dealType = searchParams.get("dealType") || "";
  const commissionType = searchParams.get("commissionType") || "";
  const startDate = searchParams.get("dateStart") || "";
  const endDate = searchParams.get("dateEnd") || "";

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/commissions?${params.toString()}`);
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div>
          <Label htmlFor="status-filter">Status</Label>
          <Select value={status} onValueChange={(value) => updateFilter("status", value)}>
            <SelectTrigger id="status-filter">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="held">Held</SelectItem>
              <SelectItem value="void">Void</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="deal-type-filter">Deal Type</Label>
          <Select value={dealType} onValueChange={(value) => updateFilter("dealType", value)}>
            <SelectTrigger id="deal-type-filter">
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All types</SelectItem>
              <SelectItem value="solar">Solar</SelectItem>
              <SelectItem value="hvac">HVAC</SelectItem>
              <SelectItem value="roofing">Roofing</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="commission-type-filter">Commission Type</Label>
          <Select
            value={commissionType}
            onValueChange={(value) => updateFilter("commissionType", value)}
          >
            <SelectTrigger id="commission-type-filter">
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All types</SelectItem>
              <SelectItem value="setter">Setter</SelectItem>
              <SelectItem value="closer">Closer</SelectItem>
              <SelectItem value="self_gen">Self Gen</SelectItem>
              <SelectItem value="override_reports_to_l1">Override (Team Lead)</SelectItem>
              <SelectItem value="override_reports_to_l2">Override (Area Director)</SelectItem>
              <SelectItem value="override_recruited_by_l1">Recruiting L1</SelectItem>
              <SelectItem value="override_recruited_by_l2">Recruiting L2</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="start-date-filter">Start Date</Label>
          <Input
            id="start-date-filter"
            type="date"
            value={startDate}
            onChange={(e) => updateFilter("dateStart", e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="end-date-filter">End Date</Label>
          <Input
            id="end-date-filter"
            type="date"
            value={endDate}
            onChange={(e) => updateFilter("dateEnd", e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
