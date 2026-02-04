import { BaseClass } from '../../../types/baseClass';
export declare class CancelInvitePut implements BaseClass {
    private documentId;
    private reason;
    private queryParams;
    constructor(documentId: string, reason: string);
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
