"use client";

import React from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface SettingsSectionProps {
  icon: LucideIcon;
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function SettingsSection({
  icon: Icon,
  title,
  description,
  action,
  children,
  className,
}: SettingsSectionProps) {
  return (
    <div
      className={cn(
        "bg-white border border-gray-100 rounded-xl p-6",
        "shadow-sm shadow-gray-100/50",
        "transition-all duration-200 hover:border-gray-200 hover:shadow-md hover:shadow-gray-100/80",
        className
      )}
    >
      <div className="flex items-start justify-between mb-6 gap-4">
        <div className="flex items-start gap-4">
          <div className="p-2.5 bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-lg shrink-0">
            <Icon className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="pt-0.5">
            <h3 className="text-base font-semibold text-gray-900 tracking-tight">
              {title}
            </h3>
            {description && (
              <p className="text-sm text-gray-500 mt-0.5 leading-relaxed">{description}</p>
            )}
          </div>
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      {children}
    </div>
  );
}
