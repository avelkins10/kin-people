"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const PIPELINE_STAGES: { key: string; label: string }[] = [
  { key: "lead", label: "Lead" },
  { key: "contacted", label: "Contacted" },
  { key: "interviewing", label: "Interviewing" },
  { key: "offer_sent", label: "Offer Sent" },
  { key: "agreement_sent", label: "Agreement Sent" },
  { key: "agreement_signed", label: "Agreement Signed" },
  { key: "onboarding", label: "Onboarding" },
];

interface RecruitingPipelineWidgetProps {
  stageCounts: Record<string, number>;
}

export function RecruitingPipelineWidget({
  stageCounts,
}: RecruitingPipelineWidgetProps) {
  const total = Object.values(stageCounts).reduce((a, b) => a + b, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recruiting Pipeline</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-3">
          {PIPELINE_STAGES.map(({ key, label }) => {
            const count = stageCounts[key] ?? 0;
            return (
              <div
                key={key}
                className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-3 py-2"
              >
                <span className="text-sm font-medium text-gray-700">
                  {label}
                </span>
                <span
                  className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-800"
                  aria-label={`${label}: ${count}`}
                >
                  {count}
                </span>
              </div>
            );
          })}
        </div>
        {total === 0 && (
          <p className="text-sm text-gray-500 py-2 text-center">
            No recruits in pipeline.
          </p>
        )}
        <Link href="/recruiting" className="block mt-4">
          <Button
            variant="outline"
            className="w-full"
            aria-label="View recruiting pipeline"
          >
            View Pipeline
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
