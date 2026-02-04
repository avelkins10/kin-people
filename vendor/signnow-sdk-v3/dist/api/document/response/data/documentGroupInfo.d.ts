import { FreeformInvite } from './freeformInvite';
export interface DocumentGroupInfo {
    document_group_id?: string | null;
    document_group_name?: string | null;
    invite_id?: string | null;
    invite_status?: string | null;
    sign_as_merged?: boolean;
    doc_count_in_group?: number;
    freeform_invite?: FreeformInvite;
    state?: string | null;
}
