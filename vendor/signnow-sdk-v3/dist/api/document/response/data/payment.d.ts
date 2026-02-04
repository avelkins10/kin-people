export interface Payment {
    id: string;
    user_id: string;
    email: string;
    created: string;
    amount: string;
    payment_request_id?: string | null;
    merchant_id?: string | null;
    merchant_type?: string | null;
    merchant_account_name?: string | null;
    currency_name?: string | null;
    currency?: string | null;
}
