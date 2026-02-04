export interface Check {
    id: string;
    page_number: string;
    x: string;
    y: string;
    width: string;
    height: string;
    created: string;
    allow_editing: boolean;
    owner_as_recipient: boolean;
    user_id?: string | null;
    email?: string;
}
