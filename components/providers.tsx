"use client";

import { ModalsProvider } from "@/components/ModalsContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return <ModalsProvider>{children}</ModalsProvider>;
}
