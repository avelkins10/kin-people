import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Sanitize error message for API responses so we don't expose raw third-party API JSON (e.g. Resend, SignNow). */
export function sanitizeErrorMessage(message: string, fallback = "Something went wrong. Please try again."): string {
  const trimmed = message.trim();
  if (
    trimmed.includes("api_error") ||
    trimmed.includes("request_id") ||
    (trimmed.startsWith("{") && trimmed.includes("Internal server error"))
  ) {
    return fallback;
  }
  if (trimmed.length > 400) return fallback;
  return trimmed || fallback;
}
