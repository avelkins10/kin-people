"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Users,
  UserPlus,
  Handshake,
  DollarSign,
  GitBranch,
  Settings,
  LogOut,
  GraduationCap,
  LayoutGrid,
} from "lucide-react";
import { PermissionGuard } from "@/components/auth/permission-guard";
import { Permission } from "@/lib/permissions/types";
export type Page =
'overview' |
'recruiting' |
'onboarding' |
'people' |
'org-chart' |
'deals' |
'commissions' |
'settings';
interface NavItem {
  id: Page;
  name: string;
  icon: React.ElementType;
}
interface NavSection {
  label: string;
  items: NavItem[];
}
const PAGE_HREF: Record<Page, string> = {
  overview: "/",
  recruiting: "/recruiting",
  onboarding: "/onboarding",
  people: "/people",
  "org-chart": "/org-chart",
  deals: "/deals",
  commissions: "/commissions",
  settings: "/settings",
};

interface SidebarProps {
  isOpen?: boolean;
  activePage: Page;
  onNavigate: (page: Page) => void;
}

export function Sidebar({
  isOpen = true,
  activePage,
  onNavigate,
}: SidebarProps) {
  const pathname = usePathname();
  const navSections: NavSection[] = [
  {
    label: 'Overview',
    items: [
    {
      id: 'overview',
      name: 'Dashboard',
      icon: LayoutGrid
    }]

  },
  {
    label: 'Recruiting',
    items: [
    {
      id: 'recruiting',
      name: 'Pipeline',
      icon: UserPlus
    },
    {
      id: 'onboarding',
      name: 'Onboarding',
      icon: GraduationCap
    }]

  },
  {
    label: 'Team',
    items: [
    {
      id: 'people',
      name: 'People',
      icon: Users
    },
    {
      id: 'org-chart',
      name: 'Org Chart',
      icon: GitBranch
    }]

  },
  {
    label: 'Sales & Pay',
    items: [
    {
      id: 'deals',
      name: 'Deals',
      icon: Handshake
    },
    {
      id: 'commissions',
      name: 'Commissions',
      icon: DollarSign
    }]

  }];

  return (
    <aside
      className={`fixed left-0 top-0 h-full bg-white border-r border-gray-100 z-30 transition-all duration-300 flex flex-col ${isOpen ? 'w-64' : 'w-20'}`}>

      {/* Logo */}
      <div className="p-6 flex items-center border-b border-gray-50">
        <div className="w-8 h-8 bg-black rounded-sm flex items-center justify-center mr-3 shrink-0">
          <span className="text-white font-bold text-lg">K</span>
        </div>
        {isOpen &&
        <span className="text-xl font-extrabold tracking-tight text-black">
            Kin People
          </span>
        }
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto">
        {navSections.map((section, sectionIndex) =>
        <div key={section.label} className={sectionIndex > 0 ? 'mt-6' : ''}>
            {/* Section Label */}
            {isOpen &&
          <div className="px-6 mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  {section.label}
                </span>
              </div>
          }

            {/* Section Items */}
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const href = PAGE_HREF[item.id];
                const isActive =
                  activePage === item.id ||
                  pathname === href ||
                  (href !== "/" && pathname.startsWith(href + "/"));
                return (
                  <li key={item.id}>
                    <Link
                      href={href}
                      className={`w-full flex items-center px-6 py-3 transition-all duration-200 group relative
                        ${isActive ? "text-black bg-gray-50" : "text-gray-500 hover:text-black hover:bg-gray-50"}`}
                      onClick={() => onNavigate(item.id)}
                    >
                      {isActive && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-600" />
                      )}
                      <item.icon
                        className={`w-5 h-5 shrink-0 ${isOpen ? "mr-3" : "mx-auto"}
                          ${isActive ? "text-indigo-600" : "text-gray-400 group-hover:text-black"}`}
                      />
                      {isOpen && (
                        <span
                          className={`font-bold tracking-tight text-xs ${isActive ? "text-black" : ""}`}
                        >
                          {item.name}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-100 mt-auto">
        <PermissionGuard permission={Permission.MANAGE_SETTINGS} fallback={null}>
          <Link
            href="/settings"
            className={`w-full flex items-center px-4 py-3 rounded-sm transition-colors ${activePage === "settings" ? "text-black bg-gray-50" : "text-gray-500 hover:text-black hover:bg-gray-50"}`}
            onClick={() => onNavigate("settings")}
          >
            <Settings className={`w-5 h-5 ${isOpen ? "mr-3" : "mx-auto"}`} />
            {isOpen && (
              <span className="font-bold tracking-tight text-xs">Settings</span>
            )}
          </Link>
        </PermissionGuard>
        <Link
          href="/api/auth/logout"
          className="w-full flex items-center px-4 py-3 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-sm transition-colors mt-1"
        >
          <LogOut className={`w-5 h-5 ${isOpen ? "mr-3" : "mx-auto"}`} />
          {isOpen && (
            <span className="font-bold tracking-tight text-xs">Logout</span>
          )}
        </Link>
      </div>
    </aside>);

}