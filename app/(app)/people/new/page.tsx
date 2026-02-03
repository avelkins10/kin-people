import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { hasPermission } from "@/lib/auth/check-permission";
import { Permission } from "@/lib/permissions/types";
import { AddPersonForm } from "@/components/people/add-person-form";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default async function NewPersonPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const canCreate = hasPermission(user, Permission.VIEW_ALL_PEOPLE);

  if (!canCreate) {
    redirect("/people");
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/people" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to People
          </Link>
        </Button>
      </div>
      <div className="rounded-lg bg-white p-6 shadow">
        <h2 className="text-xl font-bold mb-6">Add Person</h2>
        <AddPersonForm />
      </div>
    </main>
  );
}
