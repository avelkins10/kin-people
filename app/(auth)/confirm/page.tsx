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
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type Status = "loading" | "success" | "error";

function ConfirmContent() {
  const [status, setStatus] = useState<Status>("loading");
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(2);
  const [redirectTarget, setRedirectTarget] = useState("/dashboard");
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const tokenHash = searchParams.get("token_hash");
    const type = searchParams.get("type");
    const code = searchParams.get("code");
    const supabase = createClient();

    const isInvite = type === "invite";
    const isRecovery = type === "recovery";
    const needsPasswordSetup = isInvite || isRecovery;

    async function verifyAndSync() {
      // Establish session from URL before getUser(): hash (implicit) or code (PKCE)
      if (typeof window !== "undefined") {
        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) {
            setError(exchangeError.message);
            setStatus("error");
            return;
          }
        } else if (window.location.hash) {
          const { error: initError } = await supabase.auth.initialize();
          if (initError) {
            setError(initError.message);
            setStatus("error");
            return;
          }
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

      const interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            router.push(destination);
            router.refresh();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }

    verifyAndSync();
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
