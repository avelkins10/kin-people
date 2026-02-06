import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as
    | "signup"
    | "invite"
    | "magiclink"
    | "recovery"
    | "email_change"
    | null;
  const next = searchParams.get("next") || "/dashboard";
  const origin = new URL(request.url).origin;

  const supabase = await createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      console.error("[auth/callback] Code exchange failed:", error.message);
      return NextResponse.redirect(
        `${origin}/confirm?error=${encodeURIComponent(error.message)}`
      );
    }
    return NextResponse.redirect(`${origin}${next}`);
  }

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type,
    });
    if (error) {
      console.error("[auth/callback] OTP verification failed:", error.message);
      return NextResponse.redirect(
        `${origin}/confirm?error=${encodeURIComponent(error.message)}`
      );
    }
    return NextResponse.redirect(`${origin}${next}`);
  }

  // No code or token_hash — redirect to confirm with error
  return NextResponse.redirect(
    `${origin}/confirm?error=${encodeURIComponent("Missing authentication parameters")}`
  );
}
