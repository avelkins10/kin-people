import { Header } from './header';
export interface JsonAttribute {
    use_tls12: boolean;
    docid_queryparam: boolean;
    callback_url: string;
    integration_id?: string | null;
    headers?: Header | null;
    secret_key?: string;
}
