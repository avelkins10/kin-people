import { Document } from './document';
export interface Signer {
    email: string;
    auth_method: string;
    documents: Document[];
    first_name?: string | null;
    last_name?: string | null;
    language?: string;
    required_preset_signature_name?: string;
    redirect_uri?: string;
    decline_redirect_uri?: string;
    redirect_target?: string;
    delivery_type?: string;
}
