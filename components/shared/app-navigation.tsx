"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { PermissionGuard } from "@/components/auth/permission-guard";
import { Permission } from "@/lib/permissions/types";

function NavLink({
  href,
  label,
  isActive,
}: {
  href: string;
  label: string;
  isActive: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "min-h-[44px] min-w-[44px] inline-flex items-center text-sm font-medium transition-colors",
        isActive
          ? "text-gray-900 hover:text-gray-900"
          : "text-gray-700 hover:text-gray-900"
      )}
      aria-label={label}
      aria-current={isActive ? "page" : undefined}
    >
      {label}
    </Link>
  );
}

export function AppNavigation() {
  const pathname = usePathname();

  return (
    <nav
      className="flex items-center gap-4"
      aria-label="Main navigation"
    >
      {/*
        Role-based visibility (lib/permissions/roles.ts):
        Dashboard: universal | People: VIEW_*_PEOPLE | Recruiting: CREATE_RECRUITS
        Deals: CREATE_DEALS | Commissions: view/approve access | Org Chart: all/office
        Settings: MANAGE_SETTINGS. PermissionGuard handles loading (fallback=null).
      */}
      {/* Dashboard: universally visible */}
      <NavLink href="/dashboard" label="Dashboard" isActive={pathname === "/dashboard"} />

      {/* People: VIEW_PEOPLE-equivalent (any of: all / office / team) */}
      <PermissionGuard
        permissions={[
          Permission.VIEW_ALL_PEOPLE,
          Permission.VIEW_OWN_OFFICE_PEOPLE,
          Permission.VIEW_OWN_TEAM,
        ]}
        fallback={null}
      >
        <NavLink href="/people" label="People" isActive={pathname === "/people"} />
      </PermissionGuard>

      {/* Recruiting: CREATE_RECRUITS */}
      <PermissionGuard permission={Permission.CREATE_RECRUITS} fallback={null}>
        <NavLink href="/recruiting" label="Recruiting" isActive={pathname === "/recruiting"} />
      </PermissionGuard>

      {/* Deals: VIEW_DEALS-equivalent (CREATE_DEALS grants view access) */}
      <PermissionGuard permission={Permission.CREATE_DEALS} fallback={null}>
        <NavLink href="/deals" label="Deals" isActive={pathname === "/deals"} />
      </PermissionGuard>

      {/* Commissions: VIEW_COMMISSIONS-equivalent (all roles with deal/commission access) */}
      <PermissionGuard
        permissions={[
          Permission.VIEW_ALL_PEOPLE,
          Permission.VIEW_OWN_OFFICE_PEOPLE,
          Permission.VIEW_OWN_TEAM,
          Permission.VIEW_OWN_DATA_ONLY,
        ]}
        fallback={null}
      >
        <NavLink href="/commissions" label="Commissions" isActive={pathname === "/commissions"} />
      </PermissionGuard>

      {/* Org Chart: VIEW_ORG_CHART-equivalent (all / office people) */}
      <PermissionGuard
        permissions={[
          Permission.VIEW_ALL_PEOPLE,
          Permission.VIEW_OWN_OFFICE_PEOPLE,
        ]}
        fallback={null}
      >
        <NavLink href="/org-chart" label="Org Chart" isActive={pathname === "/org-chart"} />
      </PermissionGuard>

      {/* Settings: MANAGE_SETTINGS */}
      <PermissionGuard permission={Permission.MANAGE_SETTINGS} fallback={null}>
        <NavLink href="/settings" label="Settings" isActive={pathname === "/settings"} />
      </PermissionGuard>
    </nav>
  );
}
