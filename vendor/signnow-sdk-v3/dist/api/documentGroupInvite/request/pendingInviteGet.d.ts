import { BaseClass } from '../../../types/baseClass';
export declare class PendingInviteGet implements BaseClass {
    private documentGroupId;
    private inviteId;
    private queryParams;
    constructor(documentGroupId: string, inviteId: string);
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
