"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { User, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SettingsShellProps {
  hasAdminAccess: boolean;
  children: React.ReactNode;
}

export function SettingsShell({ hasAdminAccess, children }: SettingsShellProps) {
  const pathname = usePathname();

  return (
    <div className="space-y-6">
      <nav
        className="flex gap-1 border-b border-gray-200 pb-3"
        aria-label="Settings sections"
      >
        <Link
          href="/settings/account"
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-sm text-sm font-medium transition-colors",
            pathname === "/settings/account"
              ? "bg-gray-100 text-black"
              : "text-gray-600 hover:text-black hover:bg-gray-50"
          )}
        >
          <User className="w-4 h-4" />
          Account
        </Link>
        {hasAdminAccess && (
          <Link
            href="/settings/organization"
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-sm text-sm font-medium transition-colors",
              pathname === "/settings/organization"
                ? "bg-gray-100 text-black"
                : "text-gray-600 hover:text-black hover:bg-gray-50"
            )}
          >
            <Building2 className="w-4 h-4" />
            Organization
          </Link>
        )}
      </nav>
      {children}
    </div>
  );
}
