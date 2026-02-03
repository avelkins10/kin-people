import { getCurrentUser } from "@/lib/auth/get-current-user";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { DashboardShell } from "@/components/dashboard-shell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    redirect("/login");
  }

  const user = await getCurrentUser();

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow border border-gray-100 max-w-md text-center">
          <div className="w-16 h-16 bg-black rounded-lg flex items-center justify-center mx-auto mb-6">
            <span className="text-white font-bold text-2xl">K</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-black mb-2">
            Welcome to Kin People
          </h1>
          <p className="text-gray-500 mb-6">
            Your account has been created, but you need to be added to the system
            by an administrator before you can access the dashboard.
          </p>
          <p className="text-sm text-gray-400 mb-6">
            Signed in as:{" "}
            <span className="font-medium text-gray-600">{authUser.email}</span>
          </p>
          <Link
            href="/api/auth/logout"
            className="inline-flex items-center justify-center px-6 py-3 bg-black text-white rounded-sm text-sm font-bold hover:bg-gray-800 transition-colors"
          >
            Sign Out
          </Link>
        </div>
      </div>
    );
  }

  return <DashboardShell>{children}</DashboardShell>;
}
