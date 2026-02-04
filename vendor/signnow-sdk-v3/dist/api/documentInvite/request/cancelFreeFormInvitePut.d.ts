import { BaseClass } from '../../../types/baseClass';
export declare class CancelFreeFormInvitePut implements BaseClass {
    private inviteId;
    private reason;
    private queryParams;
    constructor(inviteId: string, reason?: string);
    getPayload(): Record<string, string>;
    getMethod(): string;
    getUrl(): string;
    getAuthMethod(): string;
    getContentType(): string;
    getQueryParams(): Record<string, string>;
    getUriParams(): {
        invite_id: string;
    };
}
