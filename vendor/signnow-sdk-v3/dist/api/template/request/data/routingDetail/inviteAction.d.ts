export interface InviteAction {
    email: string;
    role_name: string;
    action: string;
    document_id: string;
    document_name: string;
    allow_reassign?: string;
    decline_by_signature?: string;
}
