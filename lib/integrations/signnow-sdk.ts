/**
 * SignNow integration via official @signnow/api-client SDK (v1.8.2).
 * Used when USE_SIGNNOW_SDK=true; otherwise lib/integrations/signnow.ts (direct API) is used.
 *
 * The SDK uses the same legacy endpoints we rely on:
 * - Template.duplicate → POST /template/{id}/copy
 * - Document.view → GET /document/{id} (for roles)
 * - Document.invite → POST /document/{id}/invite
 */

import { getAccessToken } from "@/lib/integrations/signnow";
import type { InviteOptions, SignerConfig } from "@/lib/integrations/signnow";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const init = require("@signnow/api-client");

function getClient() {
  return init({ production: true });
}

function p<T>(fn: (params: Record<string, unknown>, cb: (err: unknown, res: T) => void) => void) {
  return (params: Record<string, unknown>) =>
    new Promise<T>((resolve, reject) => {
      fn(params, (err, res) => (err ? reject(err) : resolve(res as T)));
    });
}

/**
 * Create a document from a template using the SDK (Template.duplicate).
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
  const token = await getAccessToken();
  const api = getClient();
  const duplicate = p<{ id: string }>(api.template.duplicate.bind(api.template));
  const result = await duplicate({
    id: templateId,
    name: documentName,
    token,
  });
  return result.id;
}

/**
 * Get document roles using SDK Document.view (legacy GET /document/{id}).
 */
export async function getDocumentRoles(documentId: string): Promise<Array<{ unique_id: string; name?: string }>> {
  const token = await getAccessToken();
  const api = getClient();
  const view = p<{ roles?: Array<{ unique_id?: string; name?: string }> }>(api.document.view.bind(api.document));
  const doc = await view({ id: documentId, token });
  const roles = Array.isArray(doc.roles) ? doc.roles : [];
  return roles
    .filter((r) => r != null && typeof r === "object" && typeof (r as { unique_id?: string }).unique_id === "string")
    .map((r) => ({
      unique_id: (r as { unique_id: string }).unique_id,
      name: typeof (r as { name?: string }).name === "string" ? (r as { name: string }).name : undefined,
    }));
}

/**
 * Send multiple invites using SDK Document.invite (legacy POST /document/{id}/invite).
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
  const token = await getAccessToken();
  const api = getClient();
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
  const to = signers.map((s, i) => {
    const role = roles[i];
    return {
      email: s.email,
      role: s.role,
      role_id: role.unique_id,
      order: s.order ?? i + 1,
      reassign: "0",
      decline_by_signature: "0",
      reminder: reminderDays,
      expiration_days: expirationDays,
    };
  });
  const invite = p<{ status?: string }>(api.document.invite.bind(api.document));
  await invite({
    id: documentId,
    token,
    data: {
      from,
      to,
      subject,
      message,
      email: "disabled",
      cc: [],
    },
    options: {},
  });
}
