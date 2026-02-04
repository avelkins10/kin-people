import { BaseClass } from '../../../types/baseClass';
export declare class DocumentEmbeddedEditorLinkPost implements BaseClass {
    private documentId;
    private redirectUri;
    private redirectTarget;
    private linkExpiration;
    private queryParams;
    constructor(documentId: string, redirectUri?: string, redirectTarget?: string, linkExpiration?: number);
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
