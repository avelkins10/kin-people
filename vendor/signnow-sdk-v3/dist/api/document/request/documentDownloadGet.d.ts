import { BaseClass } from '../../../types/baseClass';
export declare class DocumentDownloadGet implements BaseClass {
    private documentId;
    private queryParams;
    constructor(documentId: string);
    getPayload(): Record<string, string>;
    getMethod(): string;
    getUrl(): string;
    getAuthMethod(): string;
    getContentType(): string;
    getQueryParams(): Record<string, string>;
    getUriParams(): {
        document_id: string;
    };
    withType(type: string): this;
    withHistory(withHistory: string): this;
}
