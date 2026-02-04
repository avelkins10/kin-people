import { z } from "zod";

export const personFormSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  roleId: z.string().min(1, "Role is required"),
  officeId: z.string().optional(),
  reportsToId: z.string().optional(),
  status: z.enum(["onboarding", "active", "inactive"], {
    required_error: "Status is required",
  }),
  hireDate: z.string().optional(),
});

export type PersonFormData = z.infer<typeof personFormSchema>;
