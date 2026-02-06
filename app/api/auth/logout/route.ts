import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
}

/**
 * POST /api/auth/logout
 *
 * Signs out the current Supabase Auth session.
 * Form submissions get a redirect to /login; fetch() callers get JSON.
 */
export async function POST(request: NextRequest) {
  const loginUrl = new URL("/login", request.url);
  try {
    await signOut();
    const contentType = request.headers.get("content-type") ?? "";
    if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
      return NextResponse.redirect(loginUrl, 302);
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error signing out:", error);
    if (request.headers.get("content-type")?.includes("form")) {
      return NextResponse.redirect(loginUrl, 302);
    }
    return NextResponse.json(
      { error: "Failed to sign out" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/auth/logout
 *
 * Signs out and redirects to login. Supports link navigation and prefetch
 * (e.g. sidebar Logout link) so the client does not receive 405.
 */
export async function GET(request: NextRequest) {
  try {
    await signOut();
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl, 302);
  } catch (error) {
    console.error("Error signing out:", error);
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl, 302);
  }
}
