/**
 * Phone number validation utilities for E.164 format.
 * E.164 format: +[country code][subscriber number]
 * Example: +14155551234 (US number)
 */

/**
 * Validate that a phone number is in E.164 format.
 * E.164 numbers start with + followed by 1-15 digits.
 *
 * @param phone - Phone number to validate
 * @returns true if valid E.164 format
 */
export function isValidE164Phone(phone: string | null | undefined): boolean {
  if (!phone || typeof phone !== "string") return false;
  // E.164: + followed by 1-15 digits (country code + subscriber number)
  // Most numbers are 10-15 digits total
  const e164Regex = /^\+[1-9]\d{6,14}$/;
  return e164Regex.test(phone);
}

/**
 * Attempt to format a phone number to E.164 format.
 * Handles common US number formats and returns null if unable to format.
 *
 * Supported input formats:
 * - +14155551234 (already E.164)
 * - 14155551234 (missing +)
 * - 4155551234 (10-digit US number, assumes +1)
 * - (415) 555-1234 (formatted US number)
 * - 415-555-1234 (dashed US number)
 * - 415.555.1234 (dotted US number)
 * - 415 555 1234 (spaced US number)
 *
 * @param phone - Phone number in various formats
 * @returns E.164 formatted phone number or null if invalid
 */
export function formatPhoneToE164(phone: string | null | undefined): string | null {
  if (!phone || typeof phone !== "string") return null;

  // Strip all non-digit characters except leading +
  const hasPlus = phone.startsWith("+");
  const digits = phone.replace(/\D/g, "");

  if (!digits) return null;

  // If already has +, validate and return
  if (hasPlus) {
    const formatted = `+${digits}`;
    return isValidE164Phone(formatted) ? formatted : null;
  }

  // 11 digits starting with 1: US number with country code
  if (digits.length === 11 && digits.startsWith("1")) {
    const formatted = `+${digits}`;
    return isValidE164Phone(formatted) ? formatted : null;
  }

  // 10 digits: assume US number, add +1
  if (digits.length === 10) {
    const formatted = `+1${digits}`;
    return isValidE164Phone(formatted) ? formatted : null;
  }

  // Other lengths with country codes (7-15 digits total)
  if (digits.length >= 7 && digits.length <= 15) {
    const formatted = `+${digits}`;
    return isValidE164Phone(formatted) ? formatted : null;
  }

  return null;
}

/**
 * Get a human-readable validation error message for a phone number.
 *
 * @param phone - Phone number to validate
 * @returns Error message or null if valid
 */
export function getPhoneValidationError(phone: string | null | undefined): string | null {
  if (!phone) {
    return "Phone number is required for SMS delivery";
  }

  const formatted = formatPhoneToE164(phone);
  if (!formatted) {
    return "Invalid phone number format. Expected format: +1XXXXXXXXXX or (XXX) XXX-XXXX";
  }

  return null;
}
