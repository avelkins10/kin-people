import { BaseClass } from '../../../types/baseClass';
export declare class SigningLinkPost implements BaseClass {
    private documentId;
    private redirectUri;
    private queryParams;
    constructor(documentId: string, redirectUri?: string);
    getPayload(): Record<string, string>;
    getMethod(): string;
    getUrl(): string;
    getAuthMethod(): string;
    getContentType(): string;
    getQueryParams(): Record<string, string>;
    getUriParams(): null;
}
