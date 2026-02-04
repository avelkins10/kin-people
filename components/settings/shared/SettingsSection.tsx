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
        "bg-white border border-gray-100 rounded-sm p-6 transition-all duration-150 hover:border-gray-200",
        className
      )}
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-50 rounded-sm">
            <Icon className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h3 className="text-lg font-extrabold uppercase tracking-tight text-black">
              {title}
            </h3>
            {description && (
              <p className="text-xs text-gray-500 mt-0.5">{description}</p>
            )}
          </div>
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}
