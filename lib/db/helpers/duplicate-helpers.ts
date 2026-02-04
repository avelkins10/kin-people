import { db } from "@/lib/db";
import { people, recruits } from "@/lib/db/schema";
import { eq, and, or, ne } from "drizzle-orm";

/**
 * Normalize a phone number to 10 digits for consistent duplicate detection.
 * Handles various formats: (801) 928-6369, +1-801-928-6369, 801.928.6369, etc.
 *
 * @param phone - The phone number to normalize
 * @returns Normalized 10-digit phone number, or null if invalid
 */
export function normalizePhone(phone: string | null | undefined): string | null {
  if (!phone) return null;

  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, "");

  // Handle US numbers with country code
  if (digits.length === 11 && digits.startsWith("1")) {
    return digits.slice(1);
  }

  // Standard 10-digit US number
  if (digits.length === 10) {
    return digits;
  }

  // Return null for invalid phone numbers (not 10 digits)
  // This prevents false positive duplicate matches
  return null;
}

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  matchedOn: ("email" | "phone")[];
  existingRecord?: {
    id: string;
    kinId: string | null;
    firstName: string;
    lastName: string;
    email: string | null;
  };
}

/**
 * Check for duplicate person by email or phone.
 *
 * @param email - Email to check
 * @param phone - Phone number to check (will be normalized)
 * @param excludeId - Optional person ID to exclude (for updates)
 * @returns Duplicate check result with matched record info
 */
export async function checkForDuplicatePerson(
  email: string,
  phone?: string | null,
  excludeId?: string
): Promise<DuplicateCheckResult> {
  const normalizedPhone = normalizePhone(phone);

  // Build conditions for email or phone match
  const matchConditions: ReturnType<typeof eq>[] = [];
  matchConditions.push(eq(people.email, email.toLowerCase()));

  if (normalizedPhone) {
    matchConditions.push(eq(people.normalizedPhone, normalizedPhone));
  }

  // Build the full condition
  let condition = or(...matchConditions);
  if (excludeId) {
    condition = and(condition, ne(people.id, excludeId));
  }

  const result = await db
    .select({
      id: people.id,
      kinId: people.kinId,
      firstName: people.firstName,
      lastName: people.lastName,
      email: people.email,
      normalizedPhone: people.normalizedPhone,
    })
    .from(people)
    .where(condition!)
    .limit(1);

  if (!result[0]) {
    return { isDuplicate: false, matchedOn: [] };
  }

  const match = result[0];
  const matchedOn: ("email" | "phone")[] = [];

  if (match.email?.toLowerCase() === email.toLowerCase()) {
    matchedOn.push("email");
  }
  if (normalizedPhone && match.normalizedPhone === normalizedPhone) {
    matchedOn.push("phone");
  }

  return {
    isDuplicate: true,
    matchedOn,
    existingRecord: {
      id: match.id,
      kinId: match.kinId,
      firstName: match.firstName,
      lastName: match.lastName,
      email: match.email,
    },
  };
}

/**
 * Check for duplicate recruit by email or phone.
 *
 * @param email - Email to check (optional for recruits)
 * @param phone - Phone number to check (will be normalized)
 * @param excludeId - Optional recruit ID to exclude (for updates)
 * @returns Duplicate check result with matched record info
 */
export async function checkForDuplicateRecruit(
  email?: string | null,
  phone?: string | null,
  excludeId?: string
): Promise<DuplicateCheckResult> {
  const normalizedPhone = normalizePhone(phone);

  // Need at least email or phone to check
  if (!email && !normalizedPhone) {
    return { isDuplicate: false, matchedOn: [] };
  }

  // Build conditions for email or phone match
  const matchConditions: ReturnType<typeof eq>[] = [];

  if (email) {
    matchConditions.push(eq(recruits.email, email.toLowerCase()));
  }
  if (normalizedPhone) {
    matchConditions.push(eq(recruits.normalizedPhone, normalizedPhone));
  }

  // Build the full condition
  let condition = or(...matchConditions);
  if (excludeId) {
    condition = and(condition, ne(recruits.id, excludeId));
  }

  const result = await db
    .select({
      id: recruits.id,
      firstName: recruits.firstName,
      lastName: recruits.lastName,
      email: recruits.email,
      normalizedPhone: recruits.normalizedPhone,
    })
    .from(recruits)
    .where(condition!)
    .limit(1);

  if (!result[0]) {
    return { isDuplicate: false, matchedOn: [] };
  }

  const match = result[0];
  const matchedOn: ("email" | "phone")[] = [];

  if (email && match.email?.toLowerCase() === email.toLowerCase()) {
    matchedOn.push("email");
  }
  if (normalizedPhone && match.normalizedPhone === normalizedPhone) {
    matchedOn.push("phone");
  }

  return {
    isDuplicate: true,
    matchedOn,
    existingRecord: {
      id: match.id,
      kinId: null, // Recruits don't have KIN IDs
      firstName: match.firstName,
      lastName: match.lastName,
      email: match.email,
    },
  };
}

/**
 * Format a user-friendly error message for duplicate detection.
 *
 * @param result - The duplicate check result
 * @param recordType - "person" or "recruit"
 * @returns Formatted error message
 */
export function formatDuplicateError(
  result: DuplicateCheckResult,
  recordType: "person" | "recruit"
): string {
  if (!result.isDuplicate || !result.existingRecord) {
    return "";
  }

  const { firstName, lastName, kinId } = result.existingRecord;
  const name = `${firstName} ${lastName}`;
  const kinIdSuffix = kinId ? ` (${kinId})` : "";
  const matchedFields = result.matchedOn.join(" and ");

  if (recordType === "person") {
    return `A person with this ${matchedFields} already exists: ${name}${kinIdSuffix}`;
  } else {
    return `A recruit with this ${matchedFields} already exists: ${name}`;
  }
}

/**
 * Check if a recruit/person already exists as an active person (hired).
 * Useful when creating recruits to warn if they're already hired.
 *
 * @param email - Email to check
 * @param phone - Phone number to check
 * @returns Duplicate check result if person found
 */
export async function checkIfAlreadyHired(
  email?: string | null,
  phone?: string | null
): Promise<DuplicateCheckResult> {
  if (!email && !phone) {
    return { isDuplicate: false, matchedOn: [] };
  }

  // Reuse the person duplicate check
  if (email) {
    return checkForDuplicatePerson(email, phone);
  }

  // Phone-only check
  const normalizedPhone = normalizePhone(phone);
  if (!normalizedPhone) {
    return { isDuplicate: false, matchedOn: [] };
  }

  const result = await db
    .select({
      id: people.id,
      kinId: people.kinId,
      firstName: people.firstName,
      lastName: people.lastName,
      email: people.email,
    })
    .from(people)
    .where(eq(people.normalizedPhone, normalizedPhone))
    .limit(1);

  if (!result[0]) {
    return { isDuplicate: false, matchedOn: [] };
  }

  return {
    isDuplicate: true,
    matchedOn: ["phone"],
    existingRecord: result[0],
  };
}
