import { Recipient } from './recipient';
import { UnmappedDocument } from './unmappedDocument';
import { AllowedUnmappedSignDocument } from './allowedUnmappedSignDocument';
export interface Data {
    recipients: Recipient[];
    unmapped_documents?: UnmappedDocument[];
    allowed_unmapped_sign_documents?: AllowedUnmappedSignDocument[];
    cc?: string[];
}
