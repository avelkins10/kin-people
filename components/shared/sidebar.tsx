"use client";

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
import { cn } from "@/lib/utils";

const navSections = [
  {
    label: "Overview",
    items: [
      { id: "overview", name: "Dashboard", icon: LayoutGrid, href: "/dashboard" },
    ],
  },
  {
    label: "Recruiting",
    items: [
      { id: "recruiting", name: "Pipeline", icon: UserPlus, href: "/recruiting" },
      { id: "onboarding", name: "Onboarding", icon: GraduationCap, href: "/onboarding" },
    ],
  },
  {
    label: "Team",
    items: [
      { id: "people", name: "People", icon: Users, href: "/people" },
      { id: "org-chart", name: "Org Chart", icon: GitBranch, href: "/org-chart" },
    ],
  },
  {
    label: "Sales & Pay",
    items: [
      { id: "deals", name: "Deals", icon: Handshake, href: "/deals" },
      { id: "commissions", name: "Commissions", icon: DollarSign, href: "/commissions" },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-full w-56 bg-white border-r border-gray-100 z-30 flex flex-col">
      {/* Logo */}
      <div className="p-6 flex items-center border-b border-gray-50">
        <img src="/kinnect-logo.png" alt="KINNECT" className="w-7 h-7 mr-2.5" />
        <span className="text-base font-extrabold tracking-tight text-black">
          KINNECT
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto">
        {navSections.map((section, i) => (
          <div key={section.label} className={i > 0 ? "mt-6" : ""}>
            <div className="px-6 mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                {section.label}
              </span>
            </div>
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/dashboard" && pathname.startsWith(item.href));
                return (
                  <li key={item.id}>
                    <Link
                      href={item.href}
                      className={cn(
                        "w-full flex items-center px-6 py-3 transition-all duration-200 group relative",
                        isActive
                          ? "text-black bg-gray-50"
                          : "text-gray-500 hover:text-black hover:bg-gray-50"
                      )}
                    >
                      {isActive && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-600" />
                      )}
                      <item.icon
                        className={cn(
                          "w-5 h-5 mr-3",
                          isActive
                            ? "text-indigo-600"
                            : "text-gray-400 group-hover:text-black"
                        )}
                      />
                      <span
                        className={cn(
                          "font-bold tracking-tight text-sm",
                          isActive ? "text-black" : ""
                        )}
                      >
                        {item.name}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-100">
        <Link
          href="/settings"
          className={cn(
            "w-full flex items-center px-4 py-3 rounded-sm transition-colors",
            pathname === "/settings"
              ? "text-black bg-gray-50"
              : "text-gray-500 hover:text-black hover:bg-gray-50"
          )}
        >
          <Settings className="w-5 h-5 mr-3" />
          <span className="font-bold tracking-tight text-sm">Settings</span>
        </Link>
        <form action="/api/auth/logout" method="POST" className="w-full mt-1">
          <button
            type="submit"
            className="w-full flex items-center px-4 py-3 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-sm transition-colors"
          >
            <LogOut className="w-5 h-5 mr-3" />
            <span className="font-bold tracking-tight text-sm">Logout</span>
          </button>
        </form>
      </div>
    </aside>
  );
}
