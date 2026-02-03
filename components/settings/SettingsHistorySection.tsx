"use client";

import React, { useState, useEffect, useCallback } from "react";
import { History } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface ActivityLogEntry {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  details: Record<string, unknown> | null;
  actorId: string | null;
  actorName: string | null;
  createdAt: string;
}

const ENTITY_TYPE_LABELS: Record<string, string> = {
  office: "Office",
  role: "Role",
  team: "Team",
  pay_plan: "Pay plan",
  commission_rule: "Commission rule",
};

function formatAction(action: string): string {
  return action.charAt(0).toUpperCase() + action.slice(1);
}

function formatDetailSummary(details: Record<string, unknown> | null, action: string): string {
  if (!details) return "";
  if (action === "created") {
    const name = (details.name as string) ?? (details as { new?: { name?: string } }).new?.name;
    return name ? `"${name}"` : "";
  }
  if (action === "updated" && details.previous && details.new) {
    const prev = details.previous as Record<string, unknown>;
    const next = details.new as Record<string, unknown>;
    const changes: string[] = [];
    if (prev.name !== next.name && next.name) changes.push(`name → ${next.name}`);
    if (prev.level !== next.level && next.level != null) changes.push(`level → ${next.level}`);
    if (prev.isActive !== next.isActive && next.isActive != null) changes.push(next.isActive ? "activated" : "deactivated");
    if (changes.length) return changes.join(", ");
  }
  if (action === "deleted") {
    const name = details.name as string;
    return name ? `"${name}"` : "";
  }
  return "";
}

interface SettingsHistorySectionProps {
  onRefetch?: () => void;
}

export function SettingsHistorySection({ onRefetch }: SettingsHistorySectionProps) {
  const [entries, setEntries] = useState<ActivityLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [entityTypeFilter, setEntityTypeFilter] = useState<string>("all");

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ limit: "50" });
      if (entityTypeFilter && entityTypeFilter !== "all") {
        params.set("entityType", entityTypeFilter);
      }
      const res = await fetch(`/api/activity-log?${params}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error || "Failed to load history");
      }
      const data = await res.json();
      setEntries(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load history");
    } finally {
      setLoading(false);
    }
  }, [entityTypeFilter]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return (
    <div className="bg-white border border-gray-100 rounded-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-indigo-600" />
          <h3 className="text-lg font-extrabold uppercase tracking-tight text-black">
            History
          </h3>
        </div>
        <Select value={entityTypeFilter} onValueChange={setEntityTypeFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {Object.entries(ENTITY_TYPE_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {error && (
        <p className="text-sm text-red-600 mb-4">{error}</p>
      )}

      <div className="space-y-2 max-h-[400px] overflow-y-auto">
        {loading ? (
          <p className="text-sm text-gray-500">Loading...</p>
        ) : entries.length === 0 ? (
          <p className="text-sm text-gray-500">No changes recorded yet.</p>
        ) : (
          entries.map((entry) => {
            const summary = formatDetailSummary(entry.details, entry.action);
            const typeLabel = ENTITY_TYPE_LABELS[entry.entityType] ?? entry.entityType;
            const when = entry.createdAt
              ? new Date(entry.createdAt).toLocaleString(undefined, {
                  dateStyle: "short",
                  timeStyle: "short",
                })
              : "—";
            return (
              <div
                key={entry.id}
                className="flex flex-col gap-0.5 p-3 bg-gray-50 rounded-sm text-sm"
              >
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="font-bold text-gray-700">
                    {formatAction(entry.action)} {typeLabel}
                    {summary && ` ${summary}`}
                  </span>
                  <span className="text-[10px] font-bold uppercase text-gray-400">
                    {when}
                  </span>
                </div>
                {entry.actorName && (
                  <span className="text-xs text-gray-500">by {entry.actorName}</span>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
