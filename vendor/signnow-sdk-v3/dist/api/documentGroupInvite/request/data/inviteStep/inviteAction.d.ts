import { EmailGroup } from './emailGroup';
import { Authentication } from './authentication';
import { PaymentRequest } from './paymentRequest';
export interface InviteAction {
    email: string;
    role_name: string;
    action: string;
    document_id: string;
    email_group?: EmailGroup;
    required_preset_signature_name?: string;
    allow_reassign?: string;
    decline_by_signature?: string;
    authentication?: Authentication;
    payment_request?: PaymentRequest;
    redirect_uri?: string;
    decline_redirect_uri?: string;
    redirect_target?: string;
    language?: string;
}
