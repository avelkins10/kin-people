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
        "flex items-center justify-between p-4 bg-gray-50 rounded-sm",
        "border border-transparent transition-all duration-150",
        "hover:bg-white hover:border-gray-200 hover:shadow-sm",
        "group",
        onClick && "cursor-pointer",
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
          <div className="w-9 h-9 rounded-sm bg-indigo-100 flex items-center justify-center shrink-0">
            {avatar || (
              <span className="text-sm font-bold text-indigo-700">
                {initials}
              </span>
            )}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <span className="font-bold text-sm text-gray-700 block truncate">
            {title}
          </span>
          {subtitle && (
            <div className="text-[10px] font-bold uppercase text-gray-400 truncate">
              {subtitle}
            </div>
          )}
          {metadata && (
            <div className="flex items-center gap-3 mt-1">{metadata}</div>
          )}
        </div>
      </div>
      {actions && (
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150 shrink-0 ml-2">
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
        "flex items-center gap-1 text-[10px] text-gray-500",
        className
      )}
    >
      {icon}
      {children}
    </span>
  );
}
