import { z } from "zod";

export const roleFormSchema = z.object({
  name: z.string().min(1, "Role name is required"),
  level: z.coerce.number().int().min(1, "Level must be at least 1"),
  description: z.string().optional(),
  permissions: z.array(z.string()).optional(),
});

export type RoleFormData = z.infer<typeof roleFormSchema>;
