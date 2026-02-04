import { z } from "zod";

export const sendDocumentSchema = z.object({
  documentType: z.string().min(1, "Document type is required"),
  /** When set, use this preview token to send the already-created SignNow document (from Preview) instead of creating a new one. */
  previewToken: z.string().optional(),
  /** Delivery method: 'email' (default) or 'sms'. SMS sends a text message with signing link instead of email. */
  deliveryMethod: z.enum(["email", "sms"]).optional().default("email"),
});

export const templateConfigSchema = z.object({
  documentType: z.string().min(1).max(50),
  displayName: z.string().min(1).max(100),
  signnowTemplateId: z.string().max(100).optional(),
  requireRecruit: z.boolean().optional().default(true),
  requireManager: z.boolean().optional().default(false),
  requireHR: z.boolean().optional().default(false),
  expirationDays: z.number().int().optional().default(30),
  reminderFrequencyDays: z.number().int().optional().default(3),
});

/** Full create payload for document templates (extends templateConfigSchema). */
export const createTemplateSchema = templateConfigSchema.extend({
  description: z.string().optional(),
  metadata: z.record(z.unknown()).optional().default({}),
  isActive: z.boolean().optional().default(true),
});

export const resendDocumentSchema = z.object({}).optional();
