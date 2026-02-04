import { BaseClass } from '../../../types/baseClass';
import { Data } from './data/data';
export declare class DocumentPrefillSmartFieldPost implements BaseClass {
    private documentId;
    private data;
    private clientTimestamp;
    private queryParams;
    constructor(documentId: string, data: Data[], clientTimestamp: string);
    getPayload(): Record<string, string | Data[]>;
    getMethod(): string;
    getUrl(): string;
    getAuthMethod(): string;
    getContentType(): string;
    getQueryParams(): Record<string, string>;
    getUriParams(): {
        document_id: string;
    };
}
