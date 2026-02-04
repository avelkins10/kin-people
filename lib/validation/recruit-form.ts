import { z } from "zod";

export const recruitFormSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  phone: z.string().optional(),
  status: z.enum(
    [
      "lead",
      "contacted",
      "interviewing",
      "offer_sent",
      "agreement_sent",
      "agreement_signed",
      "onboarding",
    ],
    {
      required_error: "Status is required",
    }
  ).optional(),
  officeId: z.string().optional(),
  recruiterId: z.string().optional(),
  source: z.string().optional(),
  notes: z.string().optional(),
  expectedStartDate: z.string().optional(),
  hireDate: z.string().optional(),
  agreementSentDate: z.string().optional(),
  agreementSignedDate: z.string().optional(),
  targetOfficeId: z.string().optional(),
  targetTeamId: z.string().optional(),
  targetReportsToId: z.string().optional(),
  targetRoleId: z.string().optional(),
  targetPayPlanId: z.string().optional(),
});

export type RecruitFormData = z.infer<typeof recruitFormSchema>;
