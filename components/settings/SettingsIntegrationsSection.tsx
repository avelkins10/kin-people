"use client";

import React, { useState, useEffect } from "react";
import { Plug, CheckCircle, XCircle } from "lucide-react";
import Link from "next/link";
import {
  SettingsSection,
  SettingsListItem,
  MetadataItem,
  SettingsListSkeleton,
} from "@/components/settings/shared";

interface IntegrationsStatus {
  signnow: boolean;
  quickbase: boolean;
}

export function SettingsIntegrationsSection() {
  const [status, setStatus] = useState<IntegrationsStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/settings/integrations-status")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data) setStatus(data);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <SettingsSection
      icon={Plug}
      title="APIs & Integrations"
      description="Status only. Configure API keys and webhooks in your deployment environment."
    >
      {loading ? (
        <SettingsListSkeleton count={2} />
      ) : status ? (
        <div className="space-y-3">
          <SettingsListItem
            title="SignNow"
            subtitle={status.signnow ? "Configured" : "Not configured"}
            avatar={
              status.signnow ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <XCircle className="w-5 h-5 text-gray-400" />
              )
            }
            metadata={
              status.signnow ? (
                <Link
                  href="/settings/organization?tab=documents"
                  className="text-xs text-indigo-600 hover:underline"
                >
                  Configure templates
                </Link>
              ) : undefined
            }
          />
          <SettingsListItem
            title="QuickBase"
            subtitle={status.quickbase ? "Webhook configured" : "Not configured"}
            avatar={
              status.quickbase ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <XCircle className="w-5 h-5 text-gray-400" />
              )
            }
          />
        </div>
      ) : (
        <p className="text-sm text-gray-500 py-8 text-center">Unable to load status.</p>
      )}
    </SettingsSection>
  );
}
