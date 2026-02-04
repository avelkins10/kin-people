import { Authentication } from './authentication';
export interface InviteAction {
    email: string;
    document_id: string;
    document_name: string;
    allow_reassign: number;
    decline_by_signature: number;
    lock: boolean;
    action: string;
    role_name: string;
    authentication?: Authentication;
}
