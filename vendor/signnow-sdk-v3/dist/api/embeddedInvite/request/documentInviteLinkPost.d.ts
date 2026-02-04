import { BaseClass } from '../../../types/baseClass';
export declare class DocumentInviteLinkPost implements BaseClass {
    private documentId;
    private fieldInviteId;
    private authMethod;
    private linkExpiration;
    private queryParams;
    constructor(documentId: string, fieldInviteId: string, authMethod?: string, linkExpiration?: number);
    getPayload(): Record<string, string | number>;
    getMethod(): string;
    getUrl(): string;
    getAuthMethod(): string;
    getContentType(): string;
    getQueryParams(): Record<string, string>;
    getUriParams(): {
        document_id: string;
        field_invite_id: string;
    };
}
