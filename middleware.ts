import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

const isPublicRoute = (pathname: string) => {
  if (pathname === "/" || pathname === "/login" || pathname === "/signup" || pathname === "/confirm" || pathname === "/set-password" || pathname === "/auth/callback") return true;
  if (/^\/api\/webhooks\//.test(pathname)) return true;
  if (pathname === "/api/auth/debug") return true;
  return false;
};

export default async function middleware(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  // If Supabase env vars are missing, allow through (for preview)
  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.next();
  }

  const response = NextResponse.next({ request });

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
      return response;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      const signInUrl = new URL("/login", request.url);
      return NextResponse.redirect(signInUrl);
    }

    return response;
  } catch {
    return NextResponse.next();
  }
}

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
