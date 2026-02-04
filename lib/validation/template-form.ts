import { z } from "zod";

export const templateFormSchema = z.object({
  displayName: z.string().min(1, "Display name is required"),
  signnowTemplateId: z.string(),
  requireRecruit: z.boolean(),
  requireManager: z.boolean(),
  requireHR: z.boolean(),
  expirationDays: z.coerce.number().int().min(0, "Expiration days must be at least 0"),
  reminderFrequencyDays: z.coerce.number().int().min(0, "Reminder frequency must be at least 0"),
  description: z.string(),
});

export type TemplateFormData = z.infer<typeof templateFormSchema>;
