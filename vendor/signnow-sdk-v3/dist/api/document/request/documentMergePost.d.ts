import { BaseClass } from '../../../types/baseClass';
export declare class DocumentMergePost implements BaseClass {
    private name;
    private documentIds;
    private uploadDocument;
    private queryParams;
    constructor(name: string, documentIds?: string[], uploadDocument?: boolean);
    getPayload(): Record<string, string | string[] | boolean>;
    getMethod(): string;
    getUrl(): string;
    getAuthMethod(): string;
    getContentType(): string;
    getQueryParams(): Record<string, string>;
    getUriParams(): null;
}
