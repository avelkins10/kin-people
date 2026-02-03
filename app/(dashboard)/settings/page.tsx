import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { hasPermission } from "@/lib/auth/check-permission";
import { Permission } from "@/lib/permissions/types";
import { SettingsPage } from "@/components/pages/SettingsPage";

export default async function Settings() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  if (!hasPermission(user, Permission.MANAGE_SETTINGS)) {
    redirect("/settings/profile");
  }
  return <SettingsPage />;
}
