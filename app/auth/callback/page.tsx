"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

/**
 * Parse and extract auth tokens from the URL hash fragment BEFORE
 * creating the Supabase client. This is necessary because:
 * - Supabase invites use implicit flow (hash fragment with #access_token=...)
 * - @supabase/ssr sets flowType: "pkce" which rejects implicit flow tokens
 * - By parsing and clearing the hash first, we bypass that rejection
 *   and manually set the session via setSession()
 */
function extractHashTokens(): {
  access_token: string;
  refresh_token: string;
} | null {
  if (typeof window === "undefined" || !window.location.hash) return null;

  const hashParams = new URLSearchParams(
    window.location.hash.substring(1)
  );
  const access_token = hashParams.get("access_token");
  const refresh_token = hashParams.get("refresh_token");

  if (access_token && refresh_token) {
    // Clear hash so the Supabase client won't try to auto-detect and reject it
    window.location.hash = "";
    return { access_token, refresh_token };
  }
  return null;
}

function CallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  // Extract tokens from hash immediately, before any Supabase client is created
  const hashTokens = useRef(extractHashTokens());

  useEffect(() => {
    const next = searchParams.get("next") || "/dashboard";
    const code = searchParams.get("code");
    const tokenHash = searchParams.get("token_hash");
    const type = searchParams.get("type");

    async function handleCallback() {
      const supabase = createClient();

      // 1. Handle implicit flow tokens (extracted from hash before client init)
      if (hashTokens.current) {
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: hashTokens.current.access_token,
          refresh_token: hashTokens.current.refresh_token,
        });
        if (sessionError) {
          setError(sessionError.message);
          return;
        }
        router.push(next);
        return;
      }

      // 2. Handle PKCE code exchange
      if (code) {
        const { error: codeError } =
          await supabase.auth.exchangeCodeForSession(code);
        if (codeError) {
          setError(codeError.message);
          return;
        }
        router.push(next);
        return;
      }

      // 3. Handle token_hash + type (OTP verification)
      if (tokenHash && type) {
        const { error: otpError } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: type as
            | "invite"
            | "signup"
            | "recovery"
            | "magiclink"
            | "email_change",
        });
        if (otpError) {
          setError(otpError.message);
          return;
        }
        router.push(next);
        return;
      }

      setError(
        "Missing authentication parameters. The link may have expired."
      );
    }

    handleCallback();
  }, [searchParams, router]);

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-8">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Authentication failed</CardTitle>
            <CardDescription>
              We couldn&apos;t complete the sign-in. The link may have expired
              or already been used.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="rounded-md bg-red-50 p-3 text-sm text-red-800">
              {error}
            </p>
            <Button
              onClick={() => router.push("/login")}
              className="w-full"
            >
              Back to login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Signing you in</CardTitle>
          <CardDescription>
            Please wait while we verify your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"
            aria-hidden
          />
        </CardContent>
      </Card>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen flex-col items-center justify-center p-8">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Signing you in</CardTitle>
              <CardDescription>
                Please wait while we verify your account.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div
                className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"
                aria-hidden
              />
            </CardContent>
          </Card>
        </div>
      }
    >
      <CallbackContent />
    </Suspense>
  );
}
