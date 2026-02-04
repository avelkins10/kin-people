import { Header } from './header';
export interface JsonAttribute {
    use_tls12: boolean;
    docid_queryparam: boolean;
    callback_url: string;
    delete_access_token: boolean;
    include_metadata: boolean;
    integration_id?: string;
    headers?: Header | null;
}
