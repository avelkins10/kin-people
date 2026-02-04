/**
 * SignNow integration via @signnow/api-client-v3 SDK (v3.0.0).
 * Used when USE_SIGNNOW_SDK=true; otherwise lib/integrations/signnow.ts (direct API) is used.
 *
 * The SDK uses the legacy endpoints:
 * - CloneTemplatePost → POST /template/{id}/copy
 * - DocumentGet → GET /document/{id} (for roles)
 * - SendInvitePost → POST /document/{id}/invite
 */

import { getAccessToken } from "@/lib/integrations/signnow";
import type { InviteOptions, SignerConfig } from "@/lib/integrations/signnow";

// Import v3 SDK core and request/response types using relative paths for Vercel compatibility
// (package.json subpath exports and webpack aliases don't resolve reliably in Vercel's build)
import { Sdk } from "../../vendor/signnow-sdk-v3/dist/core/index";
import { CloneTemplatePostRequest, type CloneTemplatePostResponse } from "../../vendor/signnow-sdk-v3/dist/api/template/index";
import {
  DocumentGetRequest,
  type DocumentGetResponse,
  type RoleResponseAttribute,
  DocumentDownloadGetRequest,
  DocumentDownloadLinkPostRequest,
  type DocumentDownloadLinkPostResponse,
} from "../../vendor/signnow-sdk-v3/dist/api/document/index";
import { SendInvitePostRequest, type SendInvitePostResponse, type ToRequestAttribute } from "../../vendor/signnow-sdk-v3/dist/api/documentInvite/index";
import { DocumentPrefillSmartFieldPostRequest } from "../../vendor/signnow-sdk-v3/dist/api/smartFields/index";
import { DocumentPrefillPutRequest, type FieldRequestAttribute } from "../../vendor/signnow-sdk-v3/dist/api/documentField/index";
import {
  DocumentInviteLinkPostRequest,
  type DocumentInviteLinkPostResponse,
  DocumentInviteDeleteRequest,
} from "../../vendor/signnow-sdk-v3/dist/api/embeddedInvite/index";

let sdkInstance: Sdk | null = null;

/**
 * Get or create a singleton SDK instance with current access token.
 */
async function getSdk(): Promise<Sdk> {
  if (!sdkInstance) {
    sdkInstance = new Sdk();
  }
  const token = await getAccessToken();
  sdkInstance.setBearerToken(token);
  return sdkInstance;
}

/**
 * Create a document from a template using the SDK (CloneTemplatePost).
 */
export async function createDocumentWithMultipleSigners(
  templateId: string,
  signers: SignerConfig[],
  documentName: string,
  _fieldValues?: Array<{ field_name: string; field_value: string }>
): Promise<string> {
  if (!signers?.length) {
    throw new Error("createDocumentWithMultipleSigners: signers array cannot be empty");
  }

  const sdk = await getSdk();
  const request = new CloneTemplatePostRequest(templateId, documentName, null, null);
  const response = await sdk.getClient().send<CloneTemplatePostResponse>(request);

  return response.id;
}

/**
 * Get document roles using SDK DocumentGet (legacy GET /document/{id}).
 */
export async function getDocumentRoles(documentId: string): Promise<Array<{ unique_id: string; name?: string }>> {
  const sdk = await getSdk();
  const request = new DocumentGetRequest(documentId);
  const doc = await sdk.getClient().send<DocumentGetResponse>(request);

  const roles: RoleResponseAttribute[] = Array.isArray(doc.roles) ? doc.roles : [];

  return roles
    .filter((r): r is RoleResponseAttribute => r != null && typeof r === "object" && typeof r.unique_id === "string")
    .map((r) => ({
      unique_id: r.unique_id,
      name: typeof r.name === "string" ? r.name : undefined,
    }));
}

/**
 * Send multiple invites using SDK SendInvitePost (legacy POST /document/{id}/invite).
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

  const sdk = await getSdk();
  const roles = await getDocumentRoles(documentId);

  if (roles.length < signers.length) {
    throw new Error(
      `Document has ${roles.length} role(s) but ${signers.length} signer(s). Template must have at least one role per signer.`
    );
  }

  const from = process.env.SIGNNOW_FROM_EMAIL || "noreply@example.com";
  const subject = options?.subject ?? "Please sign this document";
  const message = options?.message ?? "Please review and sign the document.";
  const expirationDays = options?.expirationDays ?? 30;
  const reminderDays = options?.reminderDays ?? 0;

  // Build the "to" array matching the SDK's To interface
  const to: ToRequestAttribute[] = signers.map((s, i) => {
    const role = roles[i];
    return {
      email: s.email,
      role: s.role,
      role_id: role.unique_id,
      order: s.order ?? i + 1,
      subject,
      message,
      reassign: "0",
      decline_by_signature: "0",
      reminder: reminderDays,
      expiration_days: expirationDays,
    };
  });

  const request = new SendInvitePostRequest(
    documentId,
    to,
    from,
    subject,
    message,
    [], // emailGroups
    [], // cc
    [], // ccStep
    [], // viewers
    "", // ccSubject
    ""  // ccMessage
  );

  await sdk.getClient().send<SendInvitePostResponse>(request);
}

/**
 * Prefill text fields on a document using SDK.
 * This is the correct API for regular text fields (not smart fields/integration objects).
 * Uses PUT /v2/documents/{id}/prefill-texts
 */
export async function prefillTextFields(
  documentId: string,
  fieldValues: Array<{ field_name: string; field_value: string }>
): Promise<void> {
  if (!fieldValues?.length) return;
  const sdk = await getSdk();
  const fields: FieldRequestAttribute[] = fieldValues.map((f) => ({
    field_name: f.field_name,
    prefilled_text: f.field_value,
  }));
  console.log("[signnow-sdk] prefillTextFields: documentId=", documentId, "fields=", JSON.stringify(fields.slice(0, 5)));
  const request = new DocumentPrefillPutRequest(documentId, fields);
  try {
    await sdk.getClient().send(request);
    console.log("[signnow-sdk] prefillTextFields: success");
  } catch (err) {
    console.error("[signnow-sdk] prefillTextFields: failed", {
      documentId,
      error: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
    });
    throw err;
  }
}

/**
 * Prefill smart fields on a document using SDK.
 * Only works for "smart fields" (integration objects), not regular text fields.
 * Uses POST /document/{id}/integration/object/smartfields
 *
 * @deprecated Most templates use text fields. Use prefillTextFields instead.
 */
export async function prefillSmartFields(
  documentId: string,
  fieldValues: Array<{ field_name: string; field_value: string }>
): Promise<void> {
  if (!fieldValues?.length) return;
  const sdk = await getSdk();
  // Format: each object has field_name as key, field_value as value
  // e.g., [{ "recruit_name": "John Doe" }, { "email": "john@example.com" }]
  const data = fieldValues.map((f) => ({ [f.field_name]: f.field_value }));
  const request = new DocumentPrefillSmartFieldPostRequest(
    documentId,
    data as unknown as Array<{ field_name?: string }>,
    new Date().toISOString()
  );
  await sdk.getClient().send(request);
}

/**
 * Download document as a PDF buffer using SDK.
 * Note: The SDK downloads to a temp file and returns the file path,
 * so we read the file contents and return as Buffer.
 */
export async function downloadDocument(documentId: string): Promise<Buffer> {
  const sdk = await getSdk();
  const request = new DocumentDownloadGetRequest(documentId);
  const response = await sdk.getClient().send(request);

  // SDK returns file path (string) for PDF downloads, not binary data
  if (typeof response === "string") {
    const fs = await import("fs/promises");
    const buffer = await fs.readFile(response);
    // Clean up temp file after reading
    try {
      await fs.unlink(response);
    } catch {
      // Ignore cleanup errors
    }
    return buffer;
  }

  // Fallback for other response types (shouldn't happen with current SDK)
  if (response instanceof ArrayBuffer) {
    return Buffer.from(response);
  }
  if (Buffer.isBuffer(response)) {
    return response;
  }

  throw new Error("Unexpected response type from SDK download");
}

/**
 * Generate a shareable download link for a document using SDK.
 */
export async function getDownloadLink(documentId: string): Promise<string> {
  const sdk = await getSdk();
  const request = new DocumentDownloadLinkPostRequest(documentId);
  const response = await sdk.getClient().send<DocumentDownloadLinkPostResponse>(request);
  return response.link;
}

/**
 * Create an embedded signing link for in-app signing.
 * @param documentId - SignNow document ID
 * @param fieldInviteId - The field invite ID (from document roles/invites)
 * @param linkExpirationSeconds - Link expiration in seconds (default 900 = 15 min)
 * @returns The embedded signing URL
 */
export async function createEmbeddedSigningLink(
  documentId: string,
  fieldInviteId: string,
  linkExpirationSeconds?: number
): Promise<string> {
  const sdk = await getSdk();
  const request = new DocumentInviteLinkPostRequest(
    documentId,
    fieldInviteId,
    "", // auth_method - empty for no additional auth
    linkExpirationSeconds ?? 900 // 15 min default
  );
  const response = await sdk.getClient().send<DocumentInviteLinkPostResponse>(request);
  return response.data.link;
}

/**
 * Cancel all embedded invites for a document (without voiding the document).
 */
export async function cancelEmbeddedInvite(documentId: string): Promise<void> {
  const sdk = await getSdk();
  const request = new DocumentInviteDeleteRequest(documentId);
  await sdk.getClient().send(request);
}
