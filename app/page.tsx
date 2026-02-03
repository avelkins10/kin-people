import { redirect } from "next/navigation";

// Demo mode - redirect directly to dashboard for preview
const DEMO_MODE = true;

export default async function HomePage() {
  if (DEMO_MODE) {
    redirect("/dashboard");
  }

  try {
    const { createClient } = await import("@/lib/supabase/server");
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
