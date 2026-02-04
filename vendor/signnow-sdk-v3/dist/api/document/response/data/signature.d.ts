export interface Signature {
    id: string;
    user_id: string;
    signature_request_id: string | null;
    email: string;
    page_number: string;
    width: string;
    height: string;
    x: string;
    y: string;
    subtype: string;
    allow_editing: boolean;
    created: number;
    owner_as_recipient?: boolean;
    data?: string;
}
