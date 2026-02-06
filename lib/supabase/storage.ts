/**
 * Supabase Storage utility for document operations.
 * Uses service role key for server-side admin operations (bypasses RLS).
 */

import "server-only";
import { createAdminClient } from "./admin";

/**
 * Upload a document buffer to Supabase Storage.
 * @param buffer - PDF buffer to upload
 * @param fileName - File name (e.g. agreement-{id}-{timestamp}.pdf)
 * @param bucketName - Storage bucket name (e.g. agreements)
 * @param folder - Optional folder path (e.g. agreements/recruit-{id})
 * @returns Storage path on success
 */
export async function uploadDocument(
  buffer: Buffer,
  fileName: string,
  bucketName: string,
  folder?: string
): Promise<string> {
  try {
    const supabase = createAdminClient();
    const filePath = folder ? `${folder}/${fileName}` : fileName;

    const { error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, buffer, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (error) {
      console.error(
        `[storage] Upload failed bucket=${bucketName} path=${filePath}`,
        error
      );
      throw new Error(`Storage upload failed: ${error.message}`);
    }

    return filePath;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown upload error";
    console.error(
      `[storage] uploadDocument bucket=${bucketName} path=${fileName}`,
      err
    );
    throw new Error(`uploadDocument failed: ${message}`);
  }
}

/**
 * Download a document from Supabase Storage.
 * @param bucketName - Storage bucket name
 * @param filePath - Full path within the bucket
 * @returns File buffer
 */
export async function downloadDocument(
  bucketName: string,
  filePath: string
): Promise<Buffer> {
  try {
    const supabase = createAdminClient();

    const { data, error } = await supabase.storage
      .from(bucketName)
      .download(filePath);

    if (error) {
      console.error(
        `[storage] Download failed bucket=${bucketName} path=${filePath}`,
        error
      );
      throw new Error(`Storage download failed: ${error.message}`);
    }

    if (!data) {
      throw new Error(`No data returned for ${bucketName}/${filePath}`);
    }

    const arrayBuffer = await data.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Unknown download error";
    console.error(
      `[storage] downloadDocument bucket=${bucketName} path=${filePath}`,
      err
    );
    throw new Error(`downloadDocument failed: ${message}`);
  }
}

/**
 * Delete a document from Supabase Storage.
 * @param bucketName - Storage bucket name
 * @param filePath - Full path within the bucket
 * @returns true if deleted or file not found; false on error
 */
export async function deleteDocument(
  bucketName: string,
  filePath: string
): Promise<boolean> {
  try {
    const supabase = createAdminClient();

    const { error } = await supabase.storage
      .from(bucketName)
      .remove([filePath]);

    if (error) {
      console.error(
        `[storage] Delete failed bucket=${bucketName} path=${filePath}`,
        error
      );
      return false;
    }

    return true;
  } catch (err: unknown) {
    console.error(
      `[storage] deleteDocument bucket=${bucketName} path=${filePath}`,
      err
    );
    return false;
  }
}

/**
 * Generate a signed URL for temporary access to a private object.
 * @param bucketName - Storage bucket name
 * @param filePath - Full path within the bucket
 * @param expiresIn - Seconds until URL expires (default 3600)
 * @returns Signed URL string
 */
export async function getSignedUrl(
  bucketName: string,
  filePath: string,
  expiresIn: number = 3600
): Promise<string> {
  try {
    const supabase = createAdminClient();

    const { data, error } = await supabase.storage
      .from(bucketName)
      .createSignedUrl(filePath, expiresIn);

    if (error) {
      console.error(
        `[storage] Signed URL failed bucket=${bucketName} path=${filePath}`,
        error
      );
      throw new Error(`Signed URL failed: ${error.message}`);
    }

    if (!data?.signedUrl) {
      throw new Error(`No signed URL for ${bucketName}/${filePath}`);
    }

    return data.signedUrl;
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Unknown signed URL error";
    console.error(
      `[storage] getSignedUrl bucket=${bucketName} path=${filePath}`,
      err
    );
    throw new Error(`getSignedUrl failed: ${message}`);
  }
}
