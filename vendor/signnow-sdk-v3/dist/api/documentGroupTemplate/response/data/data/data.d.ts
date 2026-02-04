import { Document } from './document';
import { Owner } from './owner';
export interface Data {
    unique_id: string;
    name: string;
    created: number;
    state: string;
    owner_email: string;
    documents: Document[];
    owner: Owner;
    invite_id?: string | null;
    last_invite_id?: string | null;
}
