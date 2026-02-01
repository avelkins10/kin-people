import { getCurrentUser } from "@/lib/auth/get-current-user";
import { redirect } from "next/navigation";
import { UserProfile } from "@/components/shared/user-profile";
import { AppNavigation } from "@/components/shared/app-navigation";

export default async function AppShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="mx-auto flex h-16 min-h-[44px] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-6">
            <h1 className="text-xl font-semibold">Kin People App</h1>
            <AppNavigation />
          </div>
          <UserProfile />
        </div>
      </header>
      {children}
    </div>
  );
}
