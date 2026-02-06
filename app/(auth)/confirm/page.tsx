"use client";

import { createClient } from "@/lib/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type Status = "loading" | "success" | "error";

/**
 * Extract auth tokens (and optional type) from URL hash BEFORE creating Supabase client.
 * @supabase/ssr uses PKCE and rejects implicit flow URLs; we set the session manually.
 */
function extractHashTokens(): {
  access_token: string;
  refresh_token: string;
  type?: string;
} | null {
  if (typeof window === "undefined" || !window.location.hash) return null;
  const hashParams = new URLSearchParams(window.location.hash.substring(1));
  const access_token = hashParams.get("access_token");
  const refresh_token = hashParams.get("refresh_token");
  const type = hashParams.get("type") ?? undefined;
  if (access_token && refresh_token) {
    window.location.hash = "";
    return { access_token, refresh_token, type };
  }
  return null;
}

function ConfirmContent() {
  const [status, setStatus] = useState<Status>("loading");
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(2);
  const [redirectTarget, setRedirectTarget] = useState("/dashboard");
  const router = useRouter();
  const searchParams = useSearchParams();
  const hashTokens = useRef(extractHashTokens());

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    const tokenHash = searchParams.get("token_hash");
    const type = searchParams.get("type");
    const code = searchParams.get("code");
    const supabase = createClient();

    const isInvite = type === "invite";
    const isRecovery = type === "recovery";
    const needsPasswordSetup = isInvite || isRecovery;

    async function verifyAndSync() {
      // 1. Implicit flow (hash): set session manually so PKCE client doesn't reject the URL
      if (hashTokens.current) {
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: hashTokens.current.access_token,
          refresh_token: hashTokens.current.refresh_token,
        });
        if (sessionError) {
          setError(sessionError.message);
          setStatus("error");
          return;
        }
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user?.email) {
          setError("Invalid or missing confirmation link.");
          setStatus("error");
          return;
        }
        await fetch("/api/auth/sync-user", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ supabaseUserId: user.id, email: user.email }),
        });
        const hashType = hashTokens.current.type;
        const needsPassword =
          hashType === "invite" || hashType === "recovery";
        const destination = needsPassword ? "/set-password" : "/dashboard";
        setRedirectTarget(destination);
        setStatus("success");
        interval = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              if (interval) clearInterval(interval);
              router.push(destination);
              router.refresh();
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
        return;
      }

      // 2. PKCE: exchange code for session
      if (code) {
        const { error: exchangeError } =
          await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) {
          setError(exchangeError.message);
          setStatus("error");
          return;
        }
      }

      // Handle invite token verification
      if (tokenHash && isInvite) {
        const { error: verifyError } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: "invite",
        });

        if (verifyError) {
          setError(verifyError.message);
          setStatus("error");
          return;
        }
      }

      // Handle signup token verification
      if (tokenHash && type === "signup") {
        const { error: verifyError } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: "signup",
        });

        if (verifyError) {
          setError(verifyError.message);
          setStatus("error");
          return;
        }
      }

      // Handle recovery (password reset) token verification
      if (tokenHash && isRecovery) {
        const { error: verifyError } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: "recovery",
        });

        if (verifyError) {
          setError(verifyError.message);
          setStatus("error");
          return;
        }
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user?.email) {
        setError("Invalid or missing confirmation link.");
        setStatus("error");
        return;
      }

      await fetch("/api/auth/sync-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supabaseUserId: user.id,
          email: user.email,
        }),
      });

      // Invite & recovery users need to set their password; others go to dashboard
      // For PKCE code flow (no type param), check if user has never signed in
      let destination = "/dashboard";
      if (needsPasswordSetup) {
        destination = "/set-password";
      } else if (code && !type && user && !user.last_sign_in_at) {
        // PKCE flow without type — user has never signed in, likely needs password
        destination = "/set-password";
      }
      setRedirectTarget(destination);
      setStatus("success");

      interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            if (interval) clearInterval(interval);
            router.push(destination);
            router.refresh();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    verifyAndSync();
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [searchParams, router]);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-8">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Confirming your email</CardTitle>
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

  if (status === "error") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-8">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Verification failed</CardTitle>
            <CardDescription>
              We couldn’t confirm your email. The link may have expired or already been used.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <p className="rounded-md bg-red-50 p-3 text-sm text-red-800">
                {error}
              </p>
            )}
            <Button
              onClick={() => {
                router.push("/login");
              }}
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
          <CardTitle>Email confirmed</CardTitle>
          <CardDescription>
            Your account is ready. Redirecting{redirectTarget === "/set-password" ? " to set your password" : " to the dashboard"} in {countdown}{" "}
            second{countdown !== 1 ? "s" : ""}…
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

function ConfirmFallback() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Confirming your email</CardTitle>
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

export default function ConfirmPage() {
  return (
    <Suspense fallback={<ConfirmFallback />}>
      <ConfirmContent />
    </Suspense>
  );
}
