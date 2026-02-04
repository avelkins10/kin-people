import { BaseClass } from '../../../types/baseClass';
export declare class GroupInviteLinkPost implements BaseClass {
    private documentGroupId;
    private embeddedInviteId;
    private email;
    private authMethod;
    private linkExpiration;
    private queryParams;
    constructor(documentGroupId: string, embeddedInviteId: string, email?: string, authMethod?: string, linkExpiration?: number);
    getPayload(): Record<string, string | number>;
    getMethod(): string;
    getUrl(): string;
    getAuthMethod(): string;
    getContentType(): string;
    getQueryParams(): Record<string, string>;
    getUriParams(): {
        document_group_id: string;
        embedded_invite_id: string;
    };
}
