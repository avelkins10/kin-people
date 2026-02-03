import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { hasPermission } from "@/lib/auth/check-permission";
import { Permission } from "@/lib/permissions/types";
import { SettingsShell } from "@/components/settings/SettingsShell";

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  const hasAdminAccess = hasPermission(user, Permission.MANAGE_SETTINGS);
  return <SettingsShell hasAdminAccess={hasAdminAccess}>{children}</SettingsShell>;
}
