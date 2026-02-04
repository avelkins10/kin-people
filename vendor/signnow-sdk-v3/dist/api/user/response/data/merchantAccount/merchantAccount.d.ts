export interface MerchantAccount {
    id: string;
    scope: string;
    merchant_type: string;
    merchant_account_name: string;
    currencies: string[];
    currency: string;
    currency_name: string;
}
