import { z } from "zod";

export const officeFormSchema = z.object({
  name: z.string().min(1, "Office name is required"),
  region: z.string().optional(),
  division: z.string().optional(),
  address: z.string().optional(),
});

export type OfficeFormData = z.infer<typeof officeFormSchema>;

export const officeCreateFormSchema = officeFormSchema.extend({
  adPersonId: z.string().min(1, "Area Director is required"),
  adEffectiveFrom: z.string().min(1, "Effective date is required"),
});

export type OfficeCreateFormData = z.infer<typeof officeCreateFormSchema>;
