import { BaseClass } from '../../../types/baseClass';
export declare class DocumentEmbeddedSendingLinkPost implements BaseClass {
    private documentId;
    private type;
    private redirectUri;
    private linkExpiration;
    private redirectTarget;
    private queryParams;
    constructor(documentId: string, type: string, redirectUri?: string, linkExpiration?: number, redirectTarget?: string);
    getPayload(): Record<string, string | number>;
    getMethod(): string;
    getUrl(): string;
    getAuthMethod(): string;
    getContentType(): string;
    getQueryParams(): Record<string, string>;
    getUriParams(): {
        document_id: string;
    };
}
