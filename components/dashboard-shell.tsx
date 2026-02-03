"use client";

import { usePathname, useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { Page } from "@/components/Sidebar";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  // Map pathname to Page type
  const getActivePage = (): Page => {
    if (pathname === "/") return "overview";
    if (pathname === "/recruiting") return "recruiting";
    if (pathname === "/people") return "people";
    if (pathname === "/onboarding") return "onboarding";
    if (pathname === "/deals") return "deals";
    if (pathname === "/commissions") return "commissions";
    if (pathname === "/org-chart") return "org-chart";
    if (pathname === "/settings") return "settings";
    return "overview";
  };

  const handleNavigate = (page: Page) => {
    const routes: Record<Page, string> = {
      overview: "/",
      recruiting: "/recruiting",
      people: "/people",
      onboarding: "/onboarding",
      deals: "/deals",
      commissions: "/commissions",
      "org-chart": "/org-chart",
      settings: "/settings",
    };
    router.push(routes[page]);
  };

  return (
    <div className="mp-dashboard">
      <AppShell activePage={getActivePage()} onNavigate={handleNavigate}>
        {children}
      </AppShell>
    </div>
  );
}
