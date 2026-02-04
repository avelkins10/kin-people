"use client";

import { ModalsProvider } from "@/components/ModalsContext";
import { Toaster } from "@/components/ui/toaster";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

/**
 * Application providers including React Query for server state management.
 *
 * React Query Configuration:
 * - staleTime: 30s - Data stays "fresh" for 30 seconds before being considered stale
 * - gcTime: 5min - Cached data is kept in memory for 5 minutes before garbage collection
 * - refetchOnWindowFocus: false - Don't automatically refetch when user returns to tab
 * - retry: 1 - Retry failed requests once before throwing error
 *
 * For usage patterns and best practices, see: docs/data-fetching-patterns.md
 */
export function Providers({ children }: { children: React.ReactNode }) {
  // Create a client instance per component to avoid sharing state between requests
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30 * 1000, // Data is fresh for 30 seconds
            gcTime: 5 * 60 * 1000, // Cache kept for 5 minutes
            refetchOnWindowFocus: false, // Don't refetch on window focus
            retry: 1, // Retry once on failure
            retryDelay: 1000, // Wait 1 second between retries
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ModalsProvider>{children}</ModalsProvider>
      <Toaster />
    </QueryClientProvider>
  );
}
