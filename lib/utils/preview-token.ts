import { createHmac, timingSafeEqual } from "crypto";

const PREVIEW_TOKEN_EXPIRY_SEC = 600; // 10 minutes

export interface PreviewTokenPayload {
  signnowDocumentId: string;
  exp: number;
}

function base64UrlEncode(buf: Buffer): string {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlDecode(str: string): Buffer {
  let b64 = str.replace(/-/g, "+").replace(/_/g, "/");
  const pad = b64.length % 4;
  if (pad) b64 += "=".repeat(4 - pad);
  return Buffer.from(b64, "base64");
}

function getSecret(): string {
  const secret = process.env.SIGNNOW_API_SECRET ?? process.env.SIGNNOW_WEBHOOK_SECRET;
  if (!secret?.trim()) {
    throw new Error("Preview token requires SIGNNOW_API_SECRET or SIGNNOW_WEBHOOK_SECRET");
  }
  return secret.trim();
}

/**
 * Create a signed preview token for a SignNow document ID.
 * Used to allow viewing the PDF and (optionally) sending or voiding that document.
 */
export function createPreviewToken(signnowDocumentId: string): string {
  const exp = Math.floor(Date.now() / 1000) + PREVIEW_TOKEN_EXPIRY_SEC;
  const payload: PreviewTokenPayload = { signnowDocumentId, exp };
  const payloadStr = JSON.stringify(payload);
  const payloadB64 = base64UrlEncode(Buffer.from(payloadStr, "utf8"));
  const secret = getSecret();
  const sig = createHmac("sha256", secret).update(payloadB64).digest();
  const sigB64 = base64UrlEncode(sig);
  return `${payloadB64}.${sigB64}`;
}

/**
 * Verify and decode a preview token. Returns payload or null if invalid/expired.
 */
export function verifyPreviewToken(token: string): PreviewTokenPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 2) return null;
    const [payloadB64, sigB64] = parts;
    const secret = getSecret();
    const expectedSig = createHmac("sha256", secret).update(payloadB64).digest();
    const actualSig = base64UrlDecode(sigB64);
    if (actualSig.length !== expectedSig.length || !timingSafeEqual(actualSig, expectedSig)) {
      return null;
    }
    const payloadStr = base64UrlDecode(payloadB64).toString("utf8");
    const payload = JSON.parse(payloadStr) as PreviewTokenPayload;
    if (!payload.signnowDocumentId || !payload.exp) return null;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null; // expired
    return payload;
  } catch {
    return null;
  }
}
