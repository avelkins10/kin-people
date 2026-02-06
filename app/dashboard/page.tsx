import { redirect } from "next/navigation";

/**
 * Dashboard is served at / (app/(dashboard)/page.tsx).
 * This route exists so links and redirects to /dashboard resolve instead of 404.
 */
export default function DashboardPage() {
  redirect("/");
}
