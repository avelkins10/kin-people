"use client";

import React from "react";
import { LucideIcon, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SettingsEmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function SettingsEmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: SettingsEmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-14 text-center",
        className
      )}
    >
      <div className="p-4 bg-gradient-to-br from-gray-100 to-gray-50 rounded-2xl mb-5 ring-1 ring-gray-100">
        <Icon className="w-7 h-7 text-gray-400" />
      </div>
      <h4 className="text-sm font-semibold text-gray-800 mb-1">{title}</h4>
      <p className="text-sm text-gray-500 max-w-xs mb-5 leading-relaxed">{description}</p>
      {action && (
        <Button
          onClick={action.onClick}
          className={cn(
            "gap-2 bg-emerald-600 hover:bg-emerald-700 text-white",
            "transition-all duration-200 font-medium shadow-sm",
            "active:scale-[0.97]"
          )}
        >
          <Plus className="w-4 h-4" />
          {action.label}
        </Button>
      )}
    </div>
  );
}
