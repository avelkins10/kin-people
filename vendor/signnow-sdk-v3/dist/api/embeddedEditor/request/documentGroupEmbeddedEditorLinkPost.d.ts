import { BaseClass } from '../../../types/baseClass';
export declare class DocumentGroupEmbeddedEditorLinkPost implements BaseClass {
    private documentGroupId;
    private redirectUri;
    private redirectTarget;
    private linkExpiration;
    private queryParams;
    constructor(documentGroupId: string, redirectUri?: string, redirectTarget?: string, linkExpiration?: number);
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
