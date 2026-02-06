/**
 * RepCard API integration
 *
 * This module provides functions to interact with the RepCard API
 * for user account creation, management, syncing, and deactivation.
 */

const DEFAULT_TIMEOUT_MS = 30000;
const BASE_URL = "https://app.repcard.com/api";

// ---------------------------------------------------------------------------
// Retry & timeout helpers (mirrors signnow.ts pattern)
// ---------------------------------------------------------------------------

interface RetryConfig {
  maxRetries?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffMultiplier?: number;
}

const DEFAULT_RETRY_CONFIG: Required<RetryConfig> = {
  maxRetries: 3,
  initialDelayMs: 100,
  maxDelayMs: 2000,
  backoffMultiplier: 2,
};

async function withRetry<T>(
  operation: () => Promise<T>,
  config: RetryConfig = {}
): Promise<T> {
  const { maxRetries, initialDelayMs, maxDelayMs, backoffMultiplier } = {
    ...DEFAULT_RETRY_CONFIG,
    ...config,
  };
  let lastError: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (err) {
      lastError = err;
      const statusCode =
        err && typeof err === "object" && "status" in err
          ? (err as { status?: number }).status
          : undefined;
      const isTransient =
        (statusCode === undefined && err instanceof TypeError) ||
        (err instanceof Error && err.message.includes("timed out")) ||
        statusCode === 429 ||
        (typeof statusCode === "number" && statusCode >= 500 && statusCode <= 504);
      if (!isTransient || attempt === maxRetries) throw err;
      const delay = Math.min(
        initialDelayMs * Math.pow(backoffMultiplier, attempt),
        maxDelayMs
      );
      const jitter = delay * 0.2 * (Math.random() * 2 - 1);
      const actualDelay = Math.max(0, Math.round(delay + jitter));
      console.log(
        `[repcard:retry] attempt ${attempt + 1}/${maxRetries + 1}, retrying in ${actualDelay}ms`,
        { error: String(lastError) }
      );
      await new Promise((r) => setTimeout(r, actualDelay));
    }
  }
  throw lastError;
}

async function withTimeout<T>(
  operation: (signal: AbortSignal) => Promise<T>,
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
  context?: string
): Promise<T> {
  const controller = new AbortController();
  let timeoutId: ReturnType<typeof setTimeout>;
  let settled = false;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      if (settled) return;
      settled = true;
      controller.abort();
      reject(
        new Error(
          context
            ? `RepCard operation timed out after ${timeoutMs}ms: ${context}`
            : `RepCard operation timed out after ${timeoutMs}ms`
        )
      );
    }, timeoutMs);
  });
  try {
    const result = await Promise.race([
      operation(controller.signal),
      timeoutPromise,
    ]);
    settled = true;
    return result;
  } finally {
    clearTimeout(timeoutId!);
    settled = true;
    controller.abort();
  }
}

// ---------------------------------------------------------------------------
// Logging helpers
// ---------------------------------------------------------------------------

function logApiCall(
  action: string,
  details: Record<string, unknown>,
  startTime: number
): void {
  const duration = Date.now() - startTime;
  console.log(`[repcard] ${action} completed in ${duration}ms`, details);
}

function logApiError(
  action: string,
  error: unknown,
  context: Record<string, unknown>
): void {
  const message = error instanceof Error ? error.message : String(error);
  const statusCode =
    error && typeof error === "object" && "status" in error
      ? (error as { status?: number }).status
      : undefined;
  const stack = error instanceof Error ? error.stack : undefined;
  console.error(`[repcard] ${action} failed`, {
    ...context,
    errorMessage: message,
    statusCode,
    stack,
  });
}

function throwWithStatus(message: string, status?: number): never {
  const err = new Error(message) as Error & { status?: number };
  if (status != null) err.status = status;
  throw err;
}

// ---------------------------------------------------------------------------
// Credentials
// ---------------------------------------------------------------------------

function getCredentials() {
  const apiKey = process.env.REPCARD_API_KEY;
  const companyId = process.env.REPCARD_COMPANY_ID;

  if (!apiKey || !companyId) {
    throw new Error("RepCard API credentials not configured (REPCARD_API_KEY and REPCARD_COMPANY_ID required)");
  }

  return { apiKey, companyId };
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RepcardOffice {
  id: number;
  officeName: string;
  officeCity?: string;
  officeState?: string;
}

export interface RepcardTeam {
  id: number;
  officeId: number;
  teamName: string;
  teamStatus?: number;
}

export interface RepcardRole {
  id: number;
  name: string;
  isDefault?: number;
  isOwner?: number;
}

export interface RepcardUser {
  id: number | string;
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  office?: string;
  team?: string;
  jobTitle?: string;
  roleName?: string;
  status?: number; // 1 = active, 0 = deactivated
  phoneNumber?: string;
  countryCode?: string;
  externalId?: string;
}

export interface CreateRepcardUserData {
  firstName: string;
  lastName: string;
  userEmail: string;
  phoneNumber?: string;
  jobTitle?: string;
  username: string;
  roleName: string;
  officeName: string;
  teamName?: string;
  countryCode?: string;
  externalId?: string;
}

export class RepcardApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "RepcardApiError";
    this.status = status;
  }
}

// ---------------------------------------------------------------------------
// API Functions
// ---------------------------------------------------------------------------

/**
 * Search RepCard users by query string.
 * GET /users/minimal?company_id={companyId}&search={query}
 */
export async function searchRepcardUsers(query: string): Promise<RepcardUser[]> {
  const startTime = Date.now();
  const { apiKey } = getCredentials();

  try {
    const users = await withRetry(() =>
      withTimeout(async (signal) => {
        const params = new URLSearchParams({
          search: query,
        });
        const response = await fetch(`${BASE_URL}/users/minimal?${params}`, {
          method: "GET",
          headers: { "x-api-key": apiKey },
          signal,
        });
        if (!response.ok) {
          const errorText = await response.text();
          throwWithStatus(`Failed to search RepCard users: ${errorText}`, response.status);
        }
        const data = await response.json();
        return Array.isArray(data) ? data : data.result?.data ?? data.users ?? data.data ?? [];
      }, DEFAULT_TIMEOUT_MS, "searchRepcardUsers")
    );
    logApiCall("searchRepcardUsers", { query, count: users.length }, startTime);
    return users;
  } catch (error) {
    logApiError("searchRepcardUsers", error, { query });
    throw error instanceof RepcardApiError
      ? error
      : new Error("Failed to search RepCard users. Please try again later.");
  }
}

/**
 * Get detailed RepCard user info.
 * GET /users/{userId}/details
 */
export async function getRepcardUser(userId: string): Promise<RepcardUser> {
  const startTime = Date.now();
  const { apiKey } = getCredentials();

  try {
    const user = await withRetry(() =>
      withTimeout(async (signal) => {
        const response = await fetch(`${BASE_URL}/users/${encodeURIComponent(userId)}/details`, {
          method: "GET",
          headers: { "x-api-key": apiKey },
          signal,
        });
        if (!response.ok) {
          const errorText = await response.text();
          if (response.status === 404) {
            throwWithStatus(`RepCard user ${userId} not found`, 404);
          }
          throwWithStatus(`Failed to get RepCard user: ${errorText}`, response.status);
        }
        const data = await response.json();
        return data.result ?? data;
      }, DEFAULT_TIMEOUT_MS, "getRepcardUser")
    );
    logApiCall("getRepcardUser", { userId }, startTime);
    return user;
  } catch (error) {
    logApiError("getRepcardUser", error, { userId });
    throw error instanceof RepcardApiError
      ? error
      : new Error("Failed to get RepCard user details.");
  }
}

/**
 * Create or update a RepCard user.
 * PUT /users/{userId}
 * RepCard uses PUT for both create and update operations.
 */
export async function updateRepcardUser(
  userId: string,
  data: Partial<CreateRepcardUserData>
): Promise<RepcardUser> {
  const startTime = Date.now();
  const { apiKey } = getCredentials();

  try {
    const user = await withRetry(() =>
      withTimeout(async (signal) => {
        const response = await fetch(`${BASE_URL}/users/${encodeURIComponent(userId)}`, {
          method: "PUT",
          headers: {
            "x-api-key": apiKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
          signal,
        });
        if (!response.ok) {
          const errorText = await response.text();
          throwWithStatus(`Failed to update RepCard user: ${errorText}`, response.status);
        }
        const respData = await response.json();
        return respData.result ?? respData;
      }, DEFAULT_TIMEOUT_MS, "updateRepcardUser")
    );
    logApiCall("updateRepcardUser", { userId, fields: Object.keys(data) }, startTime);
    return user;
  } catch (error) {
    logApiError("updateRepcardUser", error, { userId });
    throw error instanceof RepcardApiError
      ? error
      : new Error("Failed to update RepCard user.");
  }
}

/**
 * Deactivate a RepCard user.
 * PUT /users/{userId}/activate-deactivate { status: 0 }
 */
export async function deactivateRepcardUser(userId: string): Promise<void> {
  const startTime = Date.now();
  const { apiKey } = getCredentials();

  try {
    await withRetry(() =>
      withTimeout(async (signal) => {
        const response = await fetch(
          `${BASE_URL}/users/${encodeURIComponent(userId)}/activate-deactivate`,
          {
            method: "PUT",
            headers: {
              "x-api-key": apiKey,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ status: 0 }),
            signal,
          }
        );
        if (!response.ok) {
          const errorText = await response.text();
          throwWithStatus(`Failed to deactivate RepCard user: ${errorText}`, response.status);
        }
      }, DEFAULT_TIMEOUT_MS, "deactivateRepcardUser")
    );
    logApiCall("deactivateRepcardUser", { userId }, startTime);
  } catch (error) {
    logApiError("deactivateRepcardUser", error, { userId });
    throw error instanceof RepcardApiError
      ? error
      : new Error("Failed to deactivate RepCard user.");
  }
}

/**
 * Activate a RepCard user.
 * PUT /users/{userId}/activate-deactivate { status: 1 }
 */
export async function activateRepcardUser(userId: string): Promise<void> {
  const startTime = Date.now();
  const { apiKey } = getCredentials();

  try {
    await withRetry(() =>
      withTimeout(async (signal) => {
        const response = await fetch(
          `${BASE_URL}/users/${encodeURIComponent(userId)}/activate-deactivate`,
          {
            method: "PUT",
            headers: {
              "x-api-key": apiKey,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ status: 1 }),
            signal,
          }
        );
        if (!response.ok) {
          const errorText = await response.text();
          throwWithStatus(`Failed to activate RepCard user: ${errorText}`, response.status);
        }
      }, DEFAULT_TIMEOUT_MS, "activateRepcardUser")
    );
    logApiCall("activateRepcardUser", { userId }, startTime);
  } catch (error) {
    logApiError("activateRepcardUser", error, { userId });
    throw error instanceof RepcardApiError
      ? error
      : new Error("Failed to activate RepCard user.");
  }
}

/**
 * Unlink a RepCard user and optionally reassign to another user.
 * POST /users/{userId}/unlink
 */
export async function unlinkRepcardUser(
  userId: string,
  reassignTo?: string
): Promise<void> {
  const startTime = Date.now();
  const { apiKey } = getCredentials();

  try {
    await withRetry(() =>
      withTimeout(async (signal) => {
        const body: Record<string, unknown> = {};
        if (reassignTo) body.reassign_to = reassignTo;
        const response = await fetch(`${BASE_URL}/users/${encodeURIComponent(userId)}/unlink`, {
          method: "POST",
          headers: {
            "x-api-key": apiKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
          signal,
        });
        if (!response.ok) {
          const errorText = await response.text();
          throwWithStatus(`Failed to unlink RepCard user: ${errorText}`, response.status);
        }
      }, DEFAULT_TIMEOUT_MS, "unlinkRepcardUser")
    );
    logApiCall("unlinkRepcardUser", { userId, reassignTo }, startTime);
  } catch (error) {
    logApiError("unlinkRepcardUser", error, { userId, reassignTo });
    throw error instanceof RepcardApiError
      ? error
      : new Error("Failed to unlink RepCard user.");
  }
}

// ---------------------------------------------------------------------------
// Reference Data: Offices, Teams, Roles
// ---------------------------------------------------------------------------

/**
 * Get all RepCard offices for the company.
 * GET /offices?company_id={companyId}
 */
export async function getRepcardOffices(): Promise<RepcardOffice[]> {
  const startTime = Date.now();
  const { apiKey, companyId } = getCredentials();

  try {
    const offices = await withRetry(() =>
      withTimeout(async (signal) => {
        const response = await fetch(
          `${BASE_URL}/offices?company_id=${companyId}`,
          {
            method: "GET",
            headers: { "x-api-key": apiKey },
            signal,
          }
        );
        if (!response.ok) {
          const errorText = await response.text();
          throwWithStatus(`Failed to fetch RepCard offices: ${errorText}`, response.status);
        }
        const data = await response.json();
        return data?.result?.data ?? [];
      }, DEFAULT_TIMEOUT_MS, "getRepcardOffices")
    );
    logApiCall("getRepcardOffices", { count: offices.length }, startTime);
    return offices;
  } catch (error) {
    logApiError("getRepcardOffices", error, {});
    throw new Error("Failed to fetch RepCard offices.");
  }
}

/**
 * Get teams for a specific RepCard office.
 * GET /offices/{officeId}/teams
 */
export async function getRepcardTeamsByOffice(officeId: number): Promise<RepcardTeam[]> {
  const startTime = Date.now();
  const { apiKey } = getCredentials();

  try {
    const teams = await withRetry(() =>
      withTimeout(async (signal) => {
        const response = await fetch(
          `${BASE_URL}/offices/${officeId}/teams`,
          {
            method: "GET",
            headers: { "x-api-key": apiKey },
            signal,
          }
        );
        if (!response.ok) {
          const errorText = await response.text();
          throwWithStatus(`Failed to fetch RepCard teams: ${errorText}`, response.status);
        }
        const data = await response.json();
        return data?.result?.data ?? [];
      }, DEFAULT_TIMEOUT_MS, "getRepcardTeamsByOffice")
    );
    logApiCall("getRepcardTeamsByOffice", { officeId, count: teams.length }, startTime);
    return teams;
  } catch (error) {
    logApiError("getRepcardTeamsByOffice", error, { officeId });
    throw new Error("Failed to fetch RepCard teams.");
  }
}

/**
 * Get all teams across all RepCard offices.
 */
export async function getRepcardAllTeams(): Promise<(RepcardTeam & { officeName: string })[]> {
  const offices = await getRepcardOffices();
  const allTeams: (RepcardTeam & { officeName: string })[] = [];
  for (const office of offices) {
    try {
      const teams = await getRepcardTeamsByOffice(office.id);
      for (const team of teams) {
        allTeams.push({ ...team, officeName: office.officeName });
      }
    } catch {
      // Skip offices that fail to load teams
    }
  }
  return allTeams;
}

/**
 * Get all RepCard roles for the company.
 * GET /roles?company_id={companyId}
 */
export async function getRepcardRoles(): Promise<RepcardRole[]> {
  const startTime = Date.now();
  const { apiKey, companyId } = getCredentials();

  try {
    const roles = await withRetry(() =>
      withTimeout(async (signal) => {
        const response = await fetch(
          `${BASE_URL}/roles?company_id=${companyId}`,
          {
            method: "GET",
            headers: { "x-api-key": apiKey },
            signal,
          }
        );
        if (!response.ok) {
          const errorText = await response.text();
          throwWithStatus(`Failed to fetch RepCard roles: ${errorText}`, response.status);
        }
        const data = await response.json();
        return data?.result?.data ?? [];
      }, DEFAULT_TIMEOUT_MS, "getRepcardRoles")
    );
    logApiCall("getRepcardRoles", { count: roles.length }, startTime);
    return roles;
  } catch (error) {
    logApiError("getRepcardRoles", error, {});
    throw new Error("Failed to fetch RepCard roles.");
  }
}
