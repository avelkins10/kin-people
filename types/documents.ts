/**
 * Centralized document-related types and enums.
 */

export enum DocumentType {
  rep_agreement = "rep_agreement",
  tax_forms = "tax_forms",
  onboarding_checklist = "onboarding_checklist",
  offer_letter = "offer_letter",
  leadership_agreement = "leadership_agreement",
}

export enum DocumentStatus {
  pending = "pending",
  viewed = "viewed",
  partially_signed = "partially_signed",
  signed = "signed",
  expired = "expired",
  voided = "voided",
}

export type { Document } from "@/lib/db/schema/documents";
export type { DocumentTemplate } from "@/lib/db/schema/document-templates";
export type { DocumentWithDetails } from "@/lib/db/helpers/document-helpers";

export interface SignNowWebhookEvent {
  event: string;
  document_id: string;
  payload?: unknown;
}
