import { Header } from './header';
export interface Attribute {
    callback: string;
    delete_access_token?: boolean;
    use_tls12?: boolean;
    integration_id?: string;
    docid_queryparam?: boolean;
    headers?: Header | null;
    include_metadata?: boolean;
    secret_key?: string;
}
