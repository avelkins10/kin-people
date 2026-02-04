"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface SettingsListItemProps {
  title: string;
  subtitle?: React.ReactNode;
  metadata?: React.ReactNode;
  initials?: string;
  avatar?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function SettingsListItem({
  title,
  subtitle,
  metadata,
  initials,
  avatar,
  actions,
  className,
  onClick,
}: SettingsListItemProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between p-4 bg-gray-50/70 rounded-lg",
        "border border-transparent transition-all duration-200",
        "hover:bg-white hover:border-gray-200 hover:shadow-sm",
        "group",
        onClick && "cursor-pointer active:scale-[0.995]",
        className
      )}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
    >
      <div className="flex items-center gap-4 min-w-0 flex-1">
        {(initials || avatar) && (
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-100 to-emerald-50 flex items-center justify-center shrink-0 ring-1 ring-emerald-100">
            {avatar || (
              <span className="text-sm font-semibold text-emerald-700">
                {initials}
              </span>
            )}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <span className="font-medium text-sm text-gray-800 block truncate">
            {title}
          </span>
          {subtitle && (
            <div className="text-xs font-medium text-gray-400 truncate mt-0.5">
              {subtitle}
            </div>
          )}
          {metadata && (
            <div className="flex items-center gap-3 mt-1.5">{metadata}</div>
          )}
        </div>
      </div>
      {actions && (
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200 shrink-0 ml-3">
          {actions}
        </div>
      )}
    </div>
  );
}

interface MetadataItemProps {
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function MetadataItem({ icon, children, className }: MetadataItemProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-xs text-gray-500",
        className
      )}
    >
      {icon && <span className="text-gray-400">{icon}</span>}
      {children}
    </span>
  );
}
