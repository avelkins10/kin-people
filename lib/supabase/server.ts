import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Creates a Supabase client for use in Server Components, Server Actions, and Route Handlers.
 * Uses Next.js cookie store: reads cookies via getAll() and writes via set with try-catch
 * (writes fail silently in Server Components; middleware refreshes sessions and sets cookies).
 */
export async function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.log("[v0] createClient: Missing Supabase env vars");
    throw new Error("Missing Supabase environment variables");
  }

  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: Parameters<typeof cookieStore.set>[2]) {
        try {
          cookieStore.set(name, value, options);
        } catch {
          // Ignored in Server Components; middleware handles session refresh and cookies
        }
      },
      remove(name: string, options: Parameters<typeof cookieStore.set>[2]) {
        try {
          cookieStore.set(name, "", { ...options, maxAge: 0 });
        } catch {
          // Ignored in Server Components
        }
      },
    },
  });
}
