"use client";

import React, { useState, useEffect } from "react";
import { Plug } from "lucide-react";
import Link from "next/link";

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
    <div className="bg-white border border-gray-100 rounded-sm p-6">
      <div className="flex items-center gap-2 mb-4">
        <Plug className="w-5 h-5 text-indigo-600" />
        <h3 className="text-lg font-extrabold uppercase tracking-tight text-black">
          APIs & Integrations
        </h3>
      </div>
      <p className="text-sm text-gray-500 mb-4">
        Status only. Configure API keys and webhooks in your deployment environment (e.g. Vercel).
      </p>
      {loading ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : status ? (
        <dl className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-gray-50">
            <dt className="font-medium text-gray-700">SignNow</dt>
            <dd>
              <span
                className={
                  status.signnow
                    ? "text-green-600 text-sm font-medium"
                    : "text-gray-400 text-sm"
                }
              >
                {status.signnow ? "Configured" : "Not configured"}
              </span>
              {status.signnow && (
                <Link
                  href="/settings/organization?tab=documents"
                  className="ml-2 text-sm text-indigo-600 hover:underline"
                >
                  Configure templates
                </Link>
              )}
            </dd>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-gray-50">
            <dt className="font-medium text-gray-700">QuickBase</dt>
            <dd>
              <span
                className={
                  status.quickbase
                    ? "text-green-600 text-sm font-medium"
                    : "text-gray-400 text-sm"
                }
              >
                {status.quickbase ? "Webhook configured" : "Not configured"}
              </span>
            </dd>
          </div>
        </dl>
      ) : (
        <p className="text-sm text-gray-500">Unable to load status.</p>
      )}
    </div>
  );
}
