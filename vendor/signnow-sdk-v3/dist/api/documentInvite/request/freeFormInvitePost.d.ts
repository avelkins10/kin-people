import { BaseClass } from '../../../types/baseClass';
export declare class FreeFormInvitePost implements BaseClass {
    private documentId;
    private to;
    private from;
    private cc;
    private subject;
    private message;
    private ccSubject;
    private ccMessage;
    private language;
    private clientTimestamp;
    private callbackUrl;
    private isFirstInviteInSequence;
    private redirectUri;
    private closeRedirectUri;
    private redirectTarget;
    private queryParams;
    constructor(documentId: string, to: string, from?: string | null, cc?: string[], subject?: string | null, message?: string | null, ccSubject?: string | null, ccMessage?: string | null, language?: string | null, clientTimestamp?: number | null, callbackUrl?: string | null, isFirstInviteInSequence?: boolean | null, redirectUri?: string | null, closeRedirectUri?: string | null, redirectTarget?: string);
    getPayload(): Record<string, string | null | string[] | number | boolean>;
    getMethod(): string;
    getUrl(): string;
    getAuthMethod(): string;
    getContentType(): string;
    getQueryParams(): Record<string, string>;
    getUriParams(): {
        document_id: string;
    };
}
