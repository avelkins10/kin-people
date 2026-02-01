/**
 * SignNow API integration
 * 
 * This module provides functions to interact with the SignNow API
 * for document creation, sending for signature, and webhook handling.
 */

interface DocumentData {
  recruitName: string;
  recruitEmail: string;
  targetOffice: string;
  targetRole: string;
  targetPayPlan: string;
  recruiterName: string;
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

/**
 * Get SignNow access token using client_credentials grant (OAuth2)
 * SignNow uses client_id and client_secret with basic auth for server-to-server authentication
 */
async function getAccessToken(): Promise<string> {
  const { apiKey, apiSecret } = getCredentials();

  // SignNow OAuth2 client_credentials flow with basic auth
  // The API key is the client_id, and API secret is the client_secret
  const credentials = Buffer.from(`${apiKey}:${apiSecret}`).toString("base64");
  
  const response = await fetch("https://api.signnow.com/oauth2/token", {
    method: "POST",
    headers: {
      "Authorization": `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "client_credentials",
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to get SignNow access token: ${errorText}`);
  }

  const data = await response.json();
  return data.access_token;
}

/**
 * Get list of available SignNow templates
 */
export async function getTemplates(): Promise<Array<{ id: string; name: string }>> {
  try {
    const accessToken = await getAccessToken();

    const response = await fetch(
      `https://api.signnow.com/v2/templates`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to get SignNow templates");
    }

    const data = await response.json();
    // SignNow API may return templates in different formats
    // Adjust based on actual API response structure
    if (Array.isArray(data)) {
      return data.map((t: any) => ({ id: t.id || t.template_id, name: t.name || t.template_name || t.id || t.template_id }));
    } else if (data.templates && Array.isArray(data.templates)) {
      return data.templates.map((t: any) => ({ id: t.id || t.template_id, name: t.name || t.template_name || t.id || t.template_id }));
    } else if (data.data && Array.isArray(data.data)) {
      return data.data.map((t: any) => ({ id: t.id || t.template_id, name: t.name || t.template_name || t.id || t.template_id }));
    }
    
    return [];
  } catch (error: any) {
    console.error("Error fetching SignNow templates:", error);
    throw error;
  }
}

/**
 * Create a document from a template
 */
export async function createDocument(
  templateId: string,
  data: DocumentData
): Promise<string> {
  try {
    const accessToken = await getAccessToken();

    // Create document from template with field pre-filling
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
            {
              email: data.recruitEmail,
              role: "Signer",
              order: 1,
            },
          ],
          // Pre-fill document fields
          field_values: [
            { field_name: "recruit_name", field_value: data.recruitName },
            { field_name: "recruit_email", field_value: data.recruitEmail },
            { field_name: "target_office", field_value: data.targetOffice },
            { field_name: "target_role", field_value: data.targetRole },
            { field_name: "target_pay_plan", field_value: data.targetPayPlan },
            { field_name: "recruiter_name", field_value: data.recruiterName },
          ],
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to create document: ${error}`);
    }

    const result = await response.json();
    return result.id;
  } catch (error: any) {
    console.error("Error creating SignNow document:", error);
    throw error;
  }
}

/**
 * Send document for signature
 */
export async function sendForSignature(
  documentId: string,
  signerEmail: string,
  signerName: string,
  signerRole: string = "Signer"
): Promise<void> {
  try {
    const accessToken = await getAccessToken();

    const response = await fetch(
      `https://api.signnow.com/v2/documents/${documentId}/invite`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          invites: [
            {
              email: signerEmail,
              role: signerRole,
              order: 1,
            },
          ],
          from: process.env.SIGNNOW_FROM_EMAIL || "noreply@example.com",
          subject: "Please sign your employment agreement",
          message: `Hi ${signerName}, please review and sign your employment agreement.`,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to send document for signature: ${error}`);
    }
  } catch (error: any) {
    console.error("Error sending document for signature:", error);
    throw error;
  }
}

/**
 * Get signed document URL
 * Returns a direct download URL or data URL for server-side use
 */
export async function getDocumentUrl(documentId: string): Promise<string> {
  try {
    const accessToken = await getAccessToken();

    const response = await fetch(
      `https://api.signnow.com/v2/documents/${documentId}/download`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to get document URL");
    }

    // Check if response is a redirect to a URL
    if (response.redirected && response.url) {
      return response.url;
    }

    // If SignNow returns a JSON response with a URL field
    const contentType = response.headers.get("content-type");
    if (contentType?.includes("application/json")) {
      const data = await response.json();
      if (data.url || data.download_url || data.document_url) {
        return data.url || data.download_url || data.document_url;
      }
    }

    // If it's a binary response, convert to data URL for server-side storage
    // This can be saved to a file storage service or database
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString("base64");
    const mimeType = contentType || "application/pdf";
    return `data:${mimeType};base64,${base64}`;
  } catch (error: any) {
    console.error("Error getting document URL:", error);
    throw error;
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
