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
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type Status = "loading" | "success" | "error";

export default function ConfirmPage() {
  const [status, setStatus] = useState<Status>("loading");
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(2);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const tokenHash = searchParams.get("token_hash");
    const type = searchParams.get("type");
    const code = searchParams.get("code");
    const supabase = createClient();

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

      // Supabase may pass token_hash and type in query (custom flow); verifyOtp establishes session for that path
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

      setStatus("success");

      const interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            router.push("/dashboard");
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
                setStatus("loading");
                setError(null);
                router.push("/signup");
              }}
              className="w-full"
            >
              Try again
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
            Your account is ready. Redirecting to the dashboard in {countdown}{" "}
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
