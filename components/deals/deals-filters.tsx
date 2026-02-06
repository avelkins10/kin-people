"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function DealsFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [offices, setOffices] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);

  const officeId = searchParams.get("officeId") || "";
  const status = searchParams.get("status") || "";
  const dealType = searchParams.get("dealType") || "";
  const startDate = searchParams.get("startDate") || "";
  const endDate = searchParams.get("endDate") || "";

  useEffect(() => {
    async function fetchOffices() {
      try {
        const response = await fetch("/api/offices?active=true&scoped=true");
        if (response.ok) {
          const data = await response.json();
          setOffices(data);
        }
      } catch (error) {
        console.error("Error fetching offices:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchOffices();
  }, []);

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/deals?${params.toString()}`);
  }

  if (loading) {
    return <div className="mb-4">Loading filters...</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <Label htmlFor="office-filter">Office</Label>
          <Select value={officeId} onValueChange={(value) => updateFilter("officeId", value)}>
            <SelectTrigger id="office-filter">
              <SelectValue placeholder="All offices" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All offices</SelectItem>
              {offices.map((office) => (
                <SelectItem key={office.id} value={office.id}>
                  {office.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="status-filter">Status</Label>
          <Select value={status} onValueChange={(value) => updateFilter("status", value)}>
            <SelectTrigger id="status-filter">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All statuses</SelectItem>
              <SelectItem value="sold">Sold</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="permitted">Permitted</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="installed">Installed</SelectItem>
              <SelectItem value="pto">PTO</SelectItem>
              <SelectItem value="complete">Complete</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
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
          <Label htmlFor="start-date-filter">Start Date</Label>
          <Input
            id="start-date-filter"
            type="date"
            value={startDate}
            onChange={(e) => updateFilter("startDate", e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="end-date-filter">End Date</Label>
          <Input
            id="end-date-filter"
            type="date"
            value={endDate}
            onChange={(e) => updateFilter("endDate", e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
