import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  try {
    const supabase = await createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session) {
      redirect("/dashboard");
    }

    redirect("/login");
  } catch {
    redirect("/login");
  }
}
