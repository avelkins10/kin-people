import { BaseClass } from '../../../types/baseClass';
export declare class BulkInvitePost implements BaseClass {
    private documentId;
    private file;
    private folderId;
    private clientTimestamp;
    private documentName;
    private subject;
    private emailMessage;
    private queryParams;
    constructor(documentId: string, file: string, folderId: string, clientTimestamp?: number, documentName?: string, subject?: string, emailMessage?: string);
    getPayload(): Record<string, string | number>;
    getMethod(): string;
    getUrl(): string;
    getAuthMethod(): string;
    getContentType(): string;
    getQueryParams(): Record<string, string>;
    getUriParams(): {
        document_id: string;
    };
}
