/**
 * SignNow API integration
 * 
 * This module provides functions to interact with the SignNow API
 * for document creation, sending for signature, and webhook handling.
 */

const DEFAULT_TIMEOUT_MS = 30000;
const DOCUMENT_CREATION_TIMEOUT_MS = 45000;
const DOWNLOAD_TIMEOUT_MS = 60000;

interface RetryConfig {
  maxRetries?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffMultiplier?: number;
}

const DEFAULT_RETRY_CONFIG: Required<RetryConfig> = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
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
        `[signnow:retry] attempt ${attempt + 1}/${maxRetries + 1}, retrying in ${actualDelay}ms`,
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
            ? `SignNow operation timed out after ${timeoutMs}ms: ${context}`
            : `SignNow operation timed out after ${timeoutMs}ms`
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

function logApiCall(
  action: string,
  details: Record<string, unknown>,
  startTime: number
): void {
  const duration = Date.now() - startTime;
  console.log(`[signnow] ${action} completed in ${duration}ms`, details);
}

function logApiError(
  action: string,
  error: unknown,
  context: Record<string, unknown>
): void {
  const message =
    error instanceof Error ? error.message : String(error);
  const statusCode =
    error &&
    typeof error === "object" &&
    "status" in error
      ? (error as { status?: number }).status
      : undefined;
  const stack = error instanceof Error ? error.stack : undefined;
  console.error(`[signnow] ${action} failed`, {
    ...context,
    errorMessage: message,
    statusCode,
    stack,
  });
}

interface DocumentData {
  recruitName: string;
  recruitEmail: string;
  targetOffice: string;
  targetRole: string;
  targetPayPlan: string;
  recruiterName: string;
}

/**
 * Configuration for a single signer in multi-signer workflows.
 * @property email - Signer's email address
 * @property role - Signer's role (e.g. "Signer")
 * @property order - Optional signing order; use 1 for all signers to enable parallel signing (sign in any order)
 */
export interface SignerConfig {
  email: string;
  role: string;
  order?: number;
}

/**
 * Document data with optional expiration and reminder fields.
 * Extends DocumentData for use in createDocument when invite-phase options are needed later.
 * @property expirationDays - Optional; max 180 when used in invite
 * @property reminderDays - Optional; days after invite to send reminder
 */
export interface EnhancedDocumentData extends DocumentData {
  expirationDays?: number;
  reminderDays?: number;
}

/**
 * Options for sending invites (single or multiple signers).
 * @property expirationDays - Optional; days until invite expires (max 180)
 * @property reminderDays - Optional; days after invite to send reminder email
 * @property subject - Optional; email subject
 * @property message - Optional; email body message
 */
export interface InviteOptions {
  expirationDays?: number;
  reminderDays?: number;
  subject?: string;
  message?: string;
}

/**
 * Individual signer information in a document status response.
 * @property email - Signer email
 * @property role - Signer role
 * @property status - Signer status (e.g. "pending", "signed", "completed")
 * @property signedAt - Optional timestamp when signer signed
 */
export interface DocumentStatusSigner {
  email: string;
  role: string;
  status: string;
  signedAt?: string;
}

/**
 * Document status response from SignNow API.
 * @property id - Document ID
 * @property name - Document name
 * @property status - Overall status ("pending", "signed", "completed", "voided")
 * @property createdAt - Document creation timestamp
 * @property updatedAt - Last update timestamp
 * @property signers - List of signers with their status
 * @property completedAt - Completion timestamp if fully signed
 */
export interface DocumentStatusResponse {
  id: string;
  name: string;
  status: string;
  createdAt: string;
  updatedAt?: string;
  signers: DocumentStatusSigner[];
  completedAt?: string;
}

/**
 * Get SignNow API credentials from environment variables
 */
function getCredentials() {
  const apiKey = process.env.SIGNNOW_API_KEY;
  const apiSecret = process.env.SIGNNOW_API_SECRET;

  if (!apiKey || !apiSecret) {
    throw new Error("SignNow API credentials not configured");
  }

  return { apiKey, apiSecret };
}

function throwWithStatus(message: string, status?: number): never {
  const err = new Error(message) as Error & { status?: number };
  if (status != null) err.status = status;
  throw err;
}

/**
 * Get SignNow access token using client_credentials grant (OAuth2)
 * SignNow uses client_id and client_secret with basic auth for server-to-server authentication
 */
async function getAccessToken(): Promise<string> {
  const startTime = Date.now();
  try {
    const token = await withRetry(async () =>
      withTimeout(async (signal) => {
        const { apiKey, apiSecret } = getCredentials();
        const credentials = Buffer.from(`${apiKey}:${apiSecret}`).toString("base64");
        const response = await fetch("https://api.signnow.com/oauth2/token", {
          method: "POST",
          headers: {
            Authorization: `Basic ${credentials}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({ grant_type: "client_credentials" }),
          signal,
        });
        if (!response.ok) {
          const errorText = await response.text();
          throwWithStatus(`Failed to get SignNow access token: ${errorText}`, response.status);
        }
        const data = await response.json();
        return data.access_token;
      }, DEFAULT_TIMEOUT_MS, "getAccessToken")
    );
    logApiCall("getAccessToken", {}, startTime);
    return token;
  } catch (error) {
    logApiError("getAccessToken", error, {});
    throw new Error(
      "Failed to authenticate with SignNow. Please check API credentials and try again."
    );
  }
}

/**
 * Get list of available SignNow templates
 */
export async function getTemplates(): Promise<Array<{ id: string; name: string }>> {
  const startTime = Date.now();
  try {
    const accessToken = await getAccessToken();
    const templates = await withRetry(() =>
      withTimeout(async (signal) => {
        const response = await fetch("https://api.signnow.com/v2/templates", {
          method: "GET",
          headers: { Authorization: `Bearer ${accessToken}` },
          signal,
        });
        if (!response.ok) {
          const text = await response.text();
          throwWithStatus(`Failed to get SignNow templates: ${text}`, response.status);
        }
        const data = await response.json();
        if (Array.isArray(data)) {
          return data.map((t: { id?: string; template_id?: string; name?: string; template_name?: string }) => ({
            id: t.id ?? t.template_id ?? "",
            name: t.name ?? t.template_name ?? t.id ?? t.template_id ?? "",
          }));
        }
        if (data.templates && Array.isArray(data.templates)) {
          return data.templates.map((t: { id?: string; template_id?: string; name?: string; template_name?: string }) => ({
            id: t.id ?? t.template_id ?? "",
            name: t.name ?? t.template_name ?? t.id ?? t.template_id ?? "",
          }));
        }
        if (data.data && Array.isArray(data.data)) {
          return data.data.map((t: { id?: string; template_id?: string; name?: string; template_name?: string }) => ({
            id: t.id ?? t.template_id ?? "",
            name: t.name ?? t.template_name ?? t.id ?? t.template_id ?? "",
          }));
        }
        return [];
      }, DEFAULT_TIMEOUT_MS, "getTemplates")
    );
    logApiCall("getTemplates", { count: templates.length }, startTime);
    return templates;
  } catch (error) {
    logApiError("getTemplates", error, {});
    throw new Error("Failed to retrieve SignNow templates. Please try again later.");
  }
}

/**
 * Result of creating a document; includes id and optional invite options to apply when sending invites.
 */
export interface CreateDocumentResult {
  id: string;
  expirationDays?: number;
  reminderDays?: number;
}

/**
 * Create a document from a template.
 * Accepts enhanced data and optional expiration/reminder params; these are included in the returned
 * payload so callers can apply them when sending invites (e.g. pass to sendForSignature options).
 *
 * @param templateId - SignNow template ID
 * @param data - Document data (DocumentData or EnhancedDocumentData); may include expirationDays/reminderDays
 * @param expirationDays - Optional; applied when sending invite (max 180)
 * @param reminderDays - Optional; applied when sending invite
 * @returns Created document result with id and optional expirationDays/reminderDays for the invite step
 */
export async function createDocument(
  templateId: string,
  data: DocumentData | EnhancedDocumentData,
  expirationDays?: number,
  reminderDays?: number
): Promise<CreateDocumentResult> {
  const startTime = Date.now();
  try {
    const accessToken = await getAccessToken();
    const enhanced = data as EnhancedDocumentData;
    const inviteExpiration = expirationDays ?? enhanced.expirationDays;
    const inviteReminder = reminderDays ?? enhanced.reminderDays;
    const result = await withRetry(() =>
      withTimeout(async (signal) => {
        const response = await fetch(
          `https://api.signnow.com/v2/templates/${templateId}/documents`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              document_name: `Employment Agreement - ${data.recruitName}`,
              field_invites: [
                { email: data.recruitEmail, role: "Signer", order: 1 },
              ],
              field_values: [
                { field_name: "recruit_name", field_value: data.recruitName },
                { field_name: "recruit_email", field_value: data.recruitEmail },
                { field_name: "target_office", field_value: data.targetOffice },
                { field_name: "target_role", field_value: data.targetRole },
                { field_name: "target_pay_plan", field_value: data.targetPayPlan },
                { field_name: "recruiter_name", field_value: data.recruiterName },
              ],
            }),
            signal,
          }
        );
        if (!response.ok) {
          const error = await response.text();
          throwWithStatus(`Failed to create document: ${error}`, response.status);
        }
        return await response.json();
      }, DOCUMENT_CREATION_TIMEOUT_MS, "createDocument")
    );
    const createResult: CreateDocumentResult = { id: result.id };
    if (inviteExpiration != null) createResult.expirationDays = inviteExpiration;
    if (inviteReminder != null) createResult.reminderDays = inviteReminder;
    logApiCall("createDocument", { templateId, documentId: result.id }, startTime);
    return createResult;
  } catch (error) {
    logApiError("createDocument", error, { templateId, recruitName: data.recruitName });
    throw new Error(
      "Failed to create document from template. Please verify the template exists and try again."
    );
  }
}

/**
 * Create a document from a template with multiple signers (e.g. parallel signing).
 * Uses order 1 for all signers by default to enable "sign in any order" behavior.
 *
 * @param templateId - SignNow template ID
 * @param signers - Array of signer configs (email, role, optional order; default order 1 for parallel)
 * @param documentName - Name for the created document
 * @param fieldValues - Optional pre-filled field values
 * @returns Created document ID
 * @example
 * const docId = await createDocumentWithMultipleSigners(
 *   "template-id",
 *   [{ email: "a@example.com", role: "Signer" }, { email: "b@example.com", role: "Signer" }],
 *   "Multi-Party Agreement"
 * );
 */
export async function createDocumentWithMultipleSigners(
  templateId: string,
  signers: SignerConfig[],
  documentName: string,
  fieldValues?: Array<{ field_name: string; field_value: string }>
): Promise<string> {
  if (!signers?.length) {
    throw new Error("createDocumentWithMultipleSigners: signers array cannot be empty");
  }
  const startTime = Date.now();
  try {
    const accessToken = await getAccessToken();
    const body: {
      document_name: string;
      field_invites: Array<{ email: string; role: string; order: number }>;
      field_values?: Array<{ field_name: string; field_value: string }>;
    } = {
      document_name: documentName,
      field_invites: signers.map((s) => ({
        email: s.email,
        role: s.role,
        order: s.order ?? 1,
      })),
    };
    if (fieldValues?.length) {
      body.field_values = fieldValues;
    }
    const result = await withRetry(() =>
      withTimeout(async (signal) => {
        const response = await fetch(
          `https://api.signnow.com/v2/templates/${templateId}/documents`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
            signal,
          }
        );
        if (!response.ok) {
          const errorText = await response.text();
          throwWithStatus(
            `Failed to create document from template ${templateId}: ${errorText}`,
            response.status
          );
        }
        return await response.json();
      }, DOCUMENT_CREATION_TIMEOUT_MS, "createDocumentWithMultipleSigners")
    );
    logApiCall("createDocumentWithMultipleSigners", {
      templateId,
      documentId: result.id,
      signerCount: signers.length,
    }, startTime);
    return result.id;
  } catch (error) {
    logApiError("createDocumentWithMultipleSigners", error, {
      templateId,
      signerCount: signers.length,
      signerEmails: signers.map((s) => s.email),
    });
    throw new Error(
      "Failed to create multi-signer document. Please verify template and signer information."
    );
  }
}

/**
 * Send document for signature (single signer).
 * Optional options support expiration (max 180 days), reminder, and custom subject/message.
 * Backward compatible: calls without options work as before.
 *
 * @param documentId - SignNow document ID
 * @param signerEmail - Signer email
 * @param signerName - Signer display name
 * @param signerRole - Signer role (default "Signer")
 * @param options - Optional invite options (expirationDays max 180, reminderDays, subject, message)
 */
export async function sendForSignature(
  documentId: string,
  signerEmail: string,
  signerName: string,
  signerRole: string = "Signer",
  options?: InviteOptions
): Promise<void> {
  if (options?.expirationDays != null && options.expirationDays > 180) {
    throw new Error("sendForSignature: expirationDays cannot exceed 180");
  }
  const startTime = Date.now();
  try {
    const accessToken = await getAccessToken();
    const body: Record<string, unknown> = {
      invites: [{ email: signerEmail, role: signerRole, order: 1 }],
      from: process.env.SIGNNOW_FROM_EMAIL || "noreply@example.com",
      subject: options?.subject ?? "Please sign your employment agreement",
      message:
        options?.message ??
        `Hi ${signerName}, please review and sign your employment agreement.`,
    };
    if (options?.expirationDays != null) body.expiration_days = options.expirationDays;
    if (options?.reminderDays != null) body.reminder = options.reminderDays;
    await withRetry(() =>
      withTimeout(async (signal) => {
        const response = await fetch(
          `https://api.signnow.com/v2/documents/${documentId}/invite`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
            signal,
          }
        );
        if (!response.ok) {
          const error = await response.text();
          throwWithStatus(`Failed to send document for signature: ${error}`, response.status);
        }
      }, DEFAULT_TIMEOUT_MS, "sendForSignature")
    );
    logApiCall("sendForSignature", { documentId, signerEmail }, startTime);
  } catch (error) {
    logApiError("sendForSignature", error, { documentId, signerEmail });
    throw new Error(
      "Failed to send document for signature. Please verify the email address and try again."
    );
  }
}

/**
 * Send invites to multiple signers for an already-created document.
 *
 * @param documentId - SignNow document ID
 * @param signers - Array of signer configs (email, role, optional order)
 * @param options - Optional invite options (expirationDays max 180, reminderDays, subject, message)
 * @example
 * await sendMultipleInvites(docId, [
 *   { email: "a@example.com", role: "Signer", order: 1 },
 *   { email: "b@example.com", role: "Signer", order: 1 },
 * ], { expirationDays: 30, reminderDays: 7 });
 */
export async function sendMultipleInvites(
  documentId: string,
  signers: SignerConfig[],
  options?: InviteOptions
): Promise<void> {
  if (!signers?.length) {
    throw new Error("sendMultipleInvites: signers array cannot be empty");
  }
  if (options?.expirationDays != null && options.expirationDays > 180) {
    throw new Error("sendMultipleInvites: expirationDays cannot exceed 180");
  }
  const startTime = Date.now();
  try {
    const accessToken = await getAccessToken();
    const body: Record<string, unknown> = {
      invites: signers.map((s) => ({
        email: s.email,
        role: s.role,
        order: s.order ?? 1,
      })),
      from: process.env.SIGNNOW_FROM_EMAIL || "noreply@example.com",
      subject: options?.subject ?? "Please sign this document",
      message: options?.message ?? "Please review and sign the document.",
    };
    if (options?.expirationDays != null) body.expiration_days = options.expirationDays;
    if (options?.reminderDays != null) body.reminder = options.reminderDays;
    await withRetry(() =>
      withTimeout(async (signal) => {
        const response = await fetch(
          `https://api.signnow.com/v2/documents/${documentId}/invite`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
            signal,
          }
        );
        if (!response.ok) {
          const errorText = await response.text();
          throwWithStatus(
            `Failed to send invites for document ${documentId}: ${errorText}`,
            response.status
          );
        }
      }, DEFAULT_TIMEOUT_MS, "sendMultipleInvites")
    );
    logApiCall("sendMultipleInvites", { documentId, signerCount: signers.length }, startTime);
  } catch (error) {
    logApiError("sendMultipleInvites", error, {
      documentId,
      signerCount: signers.length,
      signerEmails: signers.map((s) => s.email),
    });
    throw new Error(
      "Failed to send invites to signers. Please verify email addresses and try again."
    );
  }
}

/**
 * Query document status from SignNow API, including signer details and timestamps.
 *
 * @param documentId - SignNow document ID
 * @returns Promise resolving to DocumentStatusResponse with status, signers, and timestamps
 * @throws Error if document not found or API request fails
 * @example
 * const status = await getDocumentStatus("doc-id-123");
 */
export async function getDocumentStatus(
  documentId: string
): Promise<DocumentStatusResponse> {
  const startTime = Date.now();
  try {
    const accessToken = await getAccessToken();
    const data = await withRetry(() =>
      withTimeout(async (signal) => {
        const response = await fetch(
          `https://api.signnow.com/v2/documents/${documentId}`,
          {
            method: "GET",
            headers: { Authorization: `Bearer ${accessToken}` },
            signal,
          }
        );
        if (!response.ok) {
          const errorText = await response.text();
          if (response.status === 404) {
            throwWithStatus(`Document ${documentId} not found`, 404);
          }
          throwWithStatus(
            `Failed to get document status for ${documentId}: ${response.status} ${errorText}`,
            response.status
          );
        }
        return await response.json();
      }, DEFAULT_TIMEOUT_MS, "getDocumentStatus")
    );
    const status =
      data.signing_status ?? data.status ?? data.document_status ?? "unknown";
    const createdAt =
      typeof data.created === "number"
        ? new Date(data.created * 1000).toISOString()
        : data.created ?? data.created_at ?? "";
    const updatedAt =
      data.updated != null
        ? typeof data.updated === "number"
          ? new Date(data.updated * 1000).toISOString()
          : String(data.updated)
        : data.updated_at != null
          ? String(data.updated_at)
          : undefined;
    const completedAt =
      data.completed != null
        ? typeof data.completed === "number"
          ? new Date(data.completed * 1000).toISOString()
          : String(data.completed)
        : data.completed_at != null
          ? String(data.completed_at)
          : undefined;
    const invites = data.field_invites ?? data.invites ?? [];
    const signers: DocumentStatusSigner[] = Array.isArray(invites)
      ? invites.map((inv: Record<string, unknown>) => ({
          email: String(inv.email ?? ""),
          role: String(inv.role ?? ""),
          status: String(inv.status ?? inv.signing_status ?? "pending"),
          signedAt:
            inv.signed_at != null
              ? typeof inv.signed_at === "number"
                ? new Date(inv.signed_at * 1000).toISOString()
                : String(inv.signed_at)
              : undefined,
        }))
      : [];
    const result: DocumentStatusResponse = {
      id: data.id ?? documentId,
      name: data.document_name ?? data.name ?? "",
      status,
      createdAt,
      signers,
    };
    if (updatedAt !== undefined) result.updatedAt = updatedAt;
    if (completedAt !== undefined) result.completedAt = completedAt;
    logApiCall("getDocumentStatus", { documentId, status: result.status }, startTime);
    return result;
  } catch (error) {
    const statusCode =
      error && typeof error === "object" && "status" in error
        ? (error as { status?: number }).status
        : undefined;
    logApiError("getDocumentStatus", error, { documentId, statusCode });
    if (error instanceof Error && error.message.includes("not found")) {
      throw error;
    }
    throw new Error(
      "Failed to retrieve document status. The document may not exist or may have been deleted."
    );
  }
}

/**
 * Cancel/void a pending document in SignNow. Cannot void already completed documents.
 *
 * @param documentId - SignNow document ID to void
 * @throws Error if document is already completed, not found, or API request fails
 * @example
 * await voidDocument("doc-id-123");
 */
export async function voidDocument(documentId: string): Promise<void> {
  const startTime = Date.now();
  try {
    const accessToken = await getAccessToken();
    await withRetry(() =>
      withTimeout(async (signal) => {
        const response = await fetch(
          "https://api.signnow.com/v2/document/fieldinvitecancel",
          {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ document_id: documentId }),
            signal,
          }
        );
        if (!response.ok) {
          const errorText = await response.text();
          if (response.status === 404) {
            throw new Error(`Document ${documentId} not found`);
          }
          const lower = errorText.toLowerCase();
          if (
            lower.includes("completed") ||
            lower.includes("already signed")
          ) {
            throw new Error(
              `Cannot void document ${documentId}: document is already completed`
            );
          }
          throwWithStatus(
            `Failed to void document ${documentId}: ${response.status} ${errorText}`,
            response.status
          );
        }
      }, DEFAULT_TIMEOUT_MS, "voidDocument")
    );
    logApiCall("voidDocument", { documentId }, startTime);
  } catch (error) {
    const statusCode =
      error && typeof error === "object" && "status" in error
        ? (error as { status?: number }).status
        : undefined;
    logApiError("voidDocument", error, { documentId, statusCode });
    if (
      error instanceof Error &&
      (error.message.includes("not found") || error.message.includes("already completed"))
    ) {
      throw error;
    }
    throw new Error(
      "Failed to void document. The document may already be completed or does not exist."
    );
  }
}

/**
 * Download signed document as a PDF buffer.
 * Use this when uploading to Supabase Storage or other file storage.
 */
export async function downloadDocument(documentId: string): Promise<Buffer> {
  const startTime = Date.now();
  try {
    const accessToken = await getAccessToken();
    const buffer = await withRetry(() =>
      withTimeout(async (signal) => {
        const response = await fetch(
          `https://api.signnow.com/v2/documents/${documentId}/download`,
          {
            method: "GET",
            headers: { Authorization: `Bearer ${accessToken}` },
            signal,
          }
        );
        if (!response.ok) {
          const errorText = await response.text();
          throwWithStatus(
            `Failed to download document ${documentId}: ${response.status} ${errorText}`,
            response.status
          );
        }
        const arrayBuffer = await response.arrayBuffer();
        return Buffer.from(arrayBuffer);
      }, DOWNLOAD_TIMEOUT_MS, "downloadDocument")
    );
    logApiCall("downloadDocument", { documentId, sizeBytes: buffer.length }, startTime);
    return buffer;
  } catch (error) {
    const statusCode =
      error && typeof error === "object" && "status" in error
        ? (error as { status?: number }).status
        : undefined;
    logApiError("downloadDocument", error, { documentId, statusCode });
    throw new Error("Failed to download document. Please try again later.");
  }
}

/**
 * Get signed document URL (legacy).
 * Returns a direct download URL or data URL for server-side use.
 * @deprecated Prefer downloadDocument() and uploading to Supabase Storage.
 */
export async function getDocumentUrl(documentId: string): Promise<string> {
  const startTime = Date.now();
  try {
    const accessToken = await getAccessToken();
    const url = await withRetry(() =>
      withTimeout(async (signal) => {
        const response = await fetch(
          `https://api.signnow.com/v2/documents/${documentId}/download`,
          {
            method: "GET",
            headers: { Authorization: `Bearer ${accessToken}` },
            signal,
          }
        );
        if (!response.ok) {
          throwWithStatus("Failed to get document URL", response.status);
        }
        if (response.redirected && response.url) {
          return response.url;
        }
        const contentType = response.headers.get("content-type");
        if (contentType?.includes("application/json")) {
          const data = await response.json();
          if (data.url || data.download_url || data.document_url) {
            return data.url || data.download_url || data.document_url;
          }
        }
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const base64 = buffer.toString("base64");
        const mimeType = contentType || "application/pdf";
        return `data:${mimeType};base64,${base64}`;
      }, DOWNLOAD_TIMEOUT_MS, "getDocumentUrl")
    );
    logApiCall("getDocumentUrl", { documentId }, startTime);
    return url;
  } catch (error) {
    logApiError("getDocumentUrl", error, { documentId });
    throw new Error("Failed to retrieve document URL. Please try again later.");
  }
}

/**
 * Verify webhook signature
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string
): boolean {
  const secret = process.env.SIGNNOW_WEBHOOK_SECRET;
  if (!secret) {
    // If no secret configured, skip verification (not recommended for production)
    console.warn("SignNow webhook secret not configured, skipping verification");
    return true;
  }

  // SignNow typically uses HMAC-SHA256 for webhook signatures
  // This is a placeholder - implement based on SignNow's actual webhook verification
  const crypto = require("crypto");
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}
