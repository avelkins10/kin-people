import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

/**
 * Refreshes the Supabase Auth session on every request.
 * Creates a Supabase client with cookie handlers that read from the request
 * and write to the response. Calling getUser() validates the token and
 * refreshes it if needed; updated cookies are returned with the response.
 */
export async function updateSession(request: NextRequest) {
  const response = NextResponse.next({ request });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.log("[v0] updateSession: Missing Supabase env vars");
    return response;
  }

  try {
    const supabase = createServerClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value;
          },
          set(name: string, value: string, options: Record<string, unknown>) {
            response.cookies.set(name, value, options as { path?: string });
          },
          remove(name: string, options: Record<string, unknown>) {
            response.cookies.set(name, "", { ...options, maxAge: 0 });
          },
        },
      }
    );

    await supabase.auth.getUser();
  } catch (error) {
    console.log("[v0] updateSession: Error:", error);
  }

  return response;
}
