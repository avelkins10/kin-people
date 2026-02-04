import { Header } from './header';
export interface JsonAttribute {
    use_tls12: boolean;
    callback_url: string;
    docid_queryparam?: boolean;
    integration_id?: string | null;
    headers?: Header | null;
    include_metadata?: boolean;
    delete_access_token?: boolean;
}
