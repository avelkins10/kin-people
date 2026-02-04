"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface SettingsListSkeletonProps {
  count?: number;
  showAvatar?: boolean;
  className?: string;
}

export function SettingsListSkeleton({
  count = 3,
  showAvatar = false,
  className,
}: SettingsListSkeletonProps) {
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <SettingsListItemSkeleton key={i} showAvatar={showAvatar} />
      ))}
    </div>
  );
}

interface SettingsListItemSkeletonProps {
  showAvatar?: boolean;
  className?: string;
}

export function SettingsListItemSkeleton({
  showAvatar = false,
  className,
}: SettingsListItemSkeletonProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between p-4 bg-gray-50 rounded-sm animate-pulse",
        className
      )}
    >
      <div className="flex items-center gap-4">
        {showAvatar && <div className="w-9 h-9 rounded-sm bg-gray-200" />}
        <div className="space-y-2">
          <div className="h-4 w-32 bg-gray-200 rounded" />
          <div className="h-3 w-24 bg-gray-200 rounded" />
        </div>
      </div>
    </div>
  );
}

interface SettingsSectionSkeletonProps {
  className?: string;
}

export function SettingsSectionSkeleton({
  className,
}: SettingsSectionSkeletonProps) {
  return (
    <div
      className={cn(
        "bg-white border border-gray-100 rounded-sm p-6 animate-pulse",
        className
      )}
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded-sm bg-gray-200" />
        <div className="space-y-2">
          <div className="h-5 w-24 bg-gray-200 rounded" />
          <div className="h-3 w-48 bg-gray-200 rounded" />
        </div>
      </div>
      <SettingsListSkeleton count={3} />
    </div>
  );
}

interface MetricCardSkeletonProps {
  className?: string;
}

export function MetricCardSkeleton({ className }: MetricCardSkeletonProps) {
  return (
    <div
      className={cn(
        "bg-gray-900 rounded-sm p-4 animate-pulse",
        className
      )}
    >
      <div className="h-3 w-16 bg-gray-700 rounded mb-2" />
      <div className="h-8 w-12 bg-gray-700 rounded" />
    </div>
  );
}
