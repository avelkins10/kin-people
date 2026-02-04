export interface Seal {
    id: string;
    page_number: string;
    x: string;
    y: string;
    width: string;
    height: string;
    created: string;
    unique_id?: string | null;
    customer_user_id?: string | null;
    email?: string;
    transaction_id?: string | null;
    data?: string;
}
