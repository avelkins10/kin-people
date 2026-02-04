import { BaseClass } from '../../../types/baseClass';
export declare class ResendGroupInvitePost implements BaseClass {
    private documentGroupId;
    private inviteId;
    private email;
    private queryParams;
    constructor(documentGroupId: string, inviteId: string, email?: string);
    getPayload(): Record<string, string>;
    getMethod(): string;
    getUrl(): string;
    getAuthMethod(): string;
    getContentType(): string;
    getQueryParams(): Record<string, string>;
    getUriParams(): {
        document_group_id: string;
        invite_id: string;
    };
}
