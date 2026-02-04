import { Header } from './header';
export interface Attribute {
    callback: string;
    use_tls_12?: boolean;
    integration_id?: string;
    docid_queryparam?: boolean;
    headers?: Header | null;
}
