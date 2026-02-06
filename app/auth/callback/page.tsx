"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

function CallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const next = searchParams.get("next") || "/dashboard";
    const code = searchParams.get("code");
    const tokenHash = searchParams.get("token_hash");
    const type = searchParams.get("type");
    const supabase = createClient();

    async function handleCallback() {
      // Handle PKCE code exchange
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

      // Handle implicit flow (hash fragment with access_token)
      // The Supabase browser client auto-detects and processes hash fragments
      if (typeof window !== "undefined" && window.location.hash) {
        // Give the Supabase client a moment to process the hash
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          setError(sessionError.message);
          return;
        }

        if (session) {
          router.push(next);
          return;
        }

        // If no session yet, listen for the auth state change
        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange((event, session) => {
          if (session) {
            subscription.unsubscribe();
            router.push(next);
          }
        });

        // Timeout after 10 seconds
        setTimeout(() => {
          subscription.unsubscribe();
          setError("Authentication timed out. Please try again.");
        }, 10000);
        return;
      }

      // Handle token_hash + type (OTP verification)
      if (tokenHash && type) {
        const { error: otpError } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: type as "invite" | "signup" | "recovery" | "magiclink" | "email_change",
        });
        if (otpError) {
          setError(otpError.message);
          return;
        }
        router.push(next);
        return;
      }

      setError("Missing authentication parameters. The link may have expired.");
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
              We couldn&apos;t complete the sign-in. The link may have expired or
              already been used.
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
