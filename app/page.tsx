import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  console.log("[v0] HomePage: Starting...");
  console.log("[v0] HomePage: NEXT_PUBLIC_SUPABASE_URL exists:", !!process.env.NEXT_PUBLIC_SUPABASE_URL);
  console.log("[v0] HomePage: NEXT_PUBLIC_SUPABASE_ANON_KEY exists:", !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  
  try {
    console.log("[v0] HomePage: Creating Supabase client...");
    const supabase = await createClient();
    console.log("[v0] HomePage: Supabase client created, getting session...");
    const {
      data: { session },
    } = await supabase.auth.getSession();
    console.log("[v0] HomePage: Session result:", session ? "Has session" : "No session");

    if (session) {
      console.log("[v0] HomePage: Redirecting to /dashboard");
      redirect("/dashboard");
    }

    console.log("[v0] HomePage: Redirecting to /login");
    redirect("/login");
  } catch (error) {
    console.log("[v0] HomePage: Error caught:", error);
    redirect("/login");
  }
}
