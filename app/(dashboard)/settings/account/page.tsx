import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { ProfilePage } from "@/components/pages/ProfilePage";

export default async function SettingsAccount() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  return (
    <ProfilePage
      user={{
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        roleName: user.roleName ?? undefined,
      }}
    />
  );
}
