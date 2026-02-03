import { Sidebar } from "@/components/shared/sidebar";

// Demo mode - bypassing auth for preview
const DEMO_MODE = true;

export default async function AppShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // In demo mode, skip authentication
  if (!DEMO_MODE) {
    const { getCurrentUser } = await import("@/lib/auth/get-current-user");
    const { redirect } = await import("next/navigation");
    const user = await getCurrentUser();
    if (!user) {
      redirect("/login");
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div className="pl-56">
        <main className="p-8">{children}</main>
      </div>
    </div>
  );
}
