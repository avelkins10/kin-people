"use client";

import React, { useState, useEffect } from "react";
import { GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const METRIC_TYPES = [
  { value: "placeholder", label: "Placeholder (—)" },
  { value: "count", label: "Count" },
  { value: "percentage", label: "Percentage" },
] as const;

interface OnboardingMetricConfig {
  label: string;
  type: "count" | "percentage" | "placeholder";
}

interface Config {
  trainingComplete: OnboardingMetricConfig;
  readyForField: OnboardingMetricConfig;
}

interface SettingsOnboardingMetricsSectionProps {
  onRefetch?: () => void;
}

export function SettingsOnboardingMetricsSection({
  onRefetch,
}: SettingsOnboardingMetricsSectionProps) {
  const [config, setConfig] = useState<Config | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [trainingLabel, setTrainingLabel] = useState("");
  const [trainingType, setTrainingType] = useState<string>("placeholder");
  const [readyLabel, setReadyLabel] = useState("");
  const [readyType, setReadyType] = useState<string>("placeholder");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/settings/onboarding-metrics");
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        setConfig(data);
        setTrainingLabel(data.trainingComplete?.label ?? "Training Complete");
        setTrainingType(data.trainingComplete?.type ?? "placeholder");
        setReadyLabel(data.readyForField?.label ?? "Ready for Field");
        setReadyType(data.readyForField?.type ?? "placeholder");
      } catch {
        if (!cancelled) setConfig(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/settings/onboarding-metrics", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trainingComplete: {
            label: trainingLabel.trim() || "Training Complete",
            type: trainingType as "count" | "percentage" | "placeholder",
          },
          readyForField: {
            label: readyLabel.trim() || "Ready for Field",
            type: readyType as "count" | "percentage" | "placeholder",
          },
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error || "Failed to save");
      }
      setConfig({
        trainingComplete: { label: trainingLabel.trim() || "Training Complete", type: trainingType as "count" | "percentage" | "placeholder" },
        readyForField: { label: readyLabel.trim() || "Ready for Field", type: readyType as "count" | "percentage" | "placeholder" },
      });
      onRefetch?.();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-sm border border-gray-200 bg-white p-6">
        <div className="flex items-center gap-2 mb-4">
          <GraduationCap className="w-5 h-5 text-gray-400" />
          <h2 className="text-lg font-semibold text-gray-900">Onboarding Metrics</h2>
        </div>
        <p className="text-sm text-gray-500">Loading…</p>
      </div>
    );
  }

  return (
    <div className="rounded-sm border border-gray-200 bg-white p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <GraduationCap className="w-5 h-5 text-gray-400" />
          <h2 className="text-lg font-semibold text-gray-900">Onboarding Metrics</h2>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : "Save"}
        </Button>
      </div>
      <p className="text-sm text-gray-500 mb-4">
        Configure labels and display type for the two onboarding metrics shown on the Onboarding page.
      </p>
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-gray-700">Metric 1</h3>
          <div>
            <Label htmlFor="training-label">Label</Label>
            <Input
              id="training-label"
              value={trainingLabel}
              onChange={(e) => setTrainingLabel(e.target.value)}
              placeholder="Training Complete"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="training-type">Type</Label>
            <Select value={trainingType} onValueChange={setTrainingType}>
              <SelectTrigger id="training-type" className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {METRIC_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-gray-700">Metric 2</h3>
          <div>
            <Label htmlFor="ready-label">Label</Label>
            <Input
              id="ready-label"
              value={readyLabel}
              onChange={(e) => setReadyLabel(e.target.value)}
              placeholder="Ready for Field"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="ready-type">Type</Label>
            <Select value={readyType} onValueChange={setReadyType}>
              <SelectTrigger id="ready-type" className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {METRIC_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );
}
