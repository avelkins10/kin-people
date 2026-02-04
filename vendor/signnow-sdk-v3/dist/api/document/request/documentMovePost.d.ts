import { BaseClass } from '../../../types/baseClass';
export declare class DocumentMovePost implements BaseClass {
    private documentId;
    private folderId;
    private queryParams;
    constructor(documentId: string, folderId: string);
    getPayload(): Record<string, string>;
    getMethod(): string;
    getUrl(): string;
    getAuthMethod(): string;
    getContentType(): string;
    getQueryParams(): Record<string, string>;
    getUriParams(): {
        document_id: string;
    };
}
