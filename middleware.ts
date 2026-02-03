import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

const isPublicRoute = (pathname: string) => {
  if (pathname === "/" || pathname === "/login" || pathname === "/signup" || pathname === "/confirm") return true;
  if (/^\/api\/webhooks\//.test(pathname)) return true;
  return false;
};

export default async function middleware(request: NextRequest) {
  console.log("[v0] Middleware: Processing", request.nextUrl.pathname);
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  console.log("[v0] Middleware: SUPABASE_URL exists:", !!supabaseUrl);
  console.log("[v0] Middleware: SUPABASE_ANON_KEY exists:", !!supabaseAnonKey);
  
  // If Supabase env vars are missing, allow through (for preview)
  if (!supabaseUrl || !supabaseAnonKey) {
    console.log("[v0] Middleware: Missing env vars, allowing through");
    return NextResponse.next();
  }

  let response = NextResponse.next({ request });

  try {
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
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
    });

    // Refresh session
    await supabase.auth.getUser();

    if (isPublicRoute(request.nextUrl.pathname)) {
      console.log("[v0] Middleware: Public route, allowing through");
      return response;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    console.log("[v0] Middleware: User exists:", !!user);

    if (!user) {
      console.log("[v0] Middleware: No user, redirecting to login");
      const signInUrl = new URL("/login", request.url);
      return NextResponse.redirect(signInUrl);
    }

    return response;
  } catch (error) {
    console.log("[v0] Middleware: Error:", error);
    return NextResponse.next();
  }
}

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
