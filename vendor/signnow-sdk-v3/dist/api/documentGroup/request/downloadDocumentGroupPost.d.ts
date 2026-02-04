import { BaseClass } from '../../../types/baseClass';
export declare class DownloadDocumentGroupPost implements BaseClass {
    private documentGroupId;
    private type;
    private withHistory;
    private documentOrder;
    private queryParams;
    constructor(documentGroupId: string, type: string, withHistory: string, documentOrder?: string[]);
    getPayload(): Record<string, string | string[]>;
    getMethod(): string;
    getUrl(): string;
    getAuthMethod(): string;
    getContentType(): string;
    getQueryParams(): Record<string, string>;
    getUriParams(): {
        document_group_id: string;
    };
}
