import { BaseClass } from '../../../types/baseClass';
export declare class DocumentGroupEmbeddedSendingLinkPost implements BaseClass {
    private documentGroupId;
    private redirectUri;
    private linkExpiration;
    private redirectTarget;
    private type;
    private queryParams;
    constructor(documentGroupId: string, redirectUri?: string, linkExpiration?: number, redirectTarget?: string, type?: string);
    getPayload(): Record<string, string | number>;
    getMethod(): string;
    getUrl(): string;
    getAuthMethod(): string;
    getContentType(): string;
    getQueryParams(): Record<string, string>;
    getUriParams(): {
        document_group_id: string;
    };
}
