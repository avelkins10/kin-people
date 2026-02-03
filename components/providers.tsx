"use client";

import { ModalsProvider } from "@/components/ModalsContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

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
            retry: 1,
            retryDelay: 1000, // Wait 1 second between retries
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ModalsProvider>{children}</ModalsProvider>
    </QueryClientProvider>
  );
}
