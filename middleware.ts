import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

const isPublicRoute = (pathname: string) => {
  if (pathname === "/" || pathname === "/login" || pathname === "/signup" || pathname === "/confirm") return true;
  if (/^\/api\/webhooks\//.test(pathname)) return true;
  return false;
};

export default async function middleware(request: NextRequest) {
  console.log("[v0] Middleware: Processing", request.nextUrl.pathname);
  
  // Check if Supabase env vars exist
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  console.log("[v0] Middleware: Supabase URL exists:", !!supabaseUrl);
  console.log("[v0] Middleware: Supabase Anon Key exists:", !!supabaseAnonKey);
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.log("[v0] Middleware: Missing Supabase env vars, allowing through");
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });

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

    // Refresh session
    await supabase.auth.getUser();
    
    console.log("[v0] Middleware: Session refreshed");

    if (isPublicRoute(request.nextUrl.pathname)) {
      console.log("[v0] Middleware: Public route, allowing through");
      return response;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    
    console.log("[v0] Middleware: User check:", user ? "authenticated" : "not authenticated");

    if (!user) {
      const signInUrl = new URL("/login", request.url);
      console.log("[v0] Middleware: Redirecting to login");
      return NextResponse.redirect(signInUrl);
    }

    return response;
  } catch (error) {
    console.log("[v0] Middleware: Error:", error);
    // On error, allow through to let page handle it
    return NextResponse.next({ request });
  }
}

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
