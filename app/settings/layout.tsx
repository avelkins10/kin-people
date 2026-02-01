import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { hasPermission } from "@/lib/auth/check-permission";
import { Permission } from "@/lib/permissions/types";

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  // Only Admin users can access settings
  if (!hasPermission(user, Permission.MANAGE_SETTINGS)) {
    redirect("/dashboard");
  }

  return <>{children}</>;
}
