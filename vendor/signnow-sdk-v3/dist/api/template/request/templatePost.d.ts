import { BaseClass } from '../../../types/baseClass';
export declare class TemplatePost implements BaseClass {
    private documentId;
    private documentName;
    private queryParams;
    constructor(documentId: string, documentName: string);
    getPayload(): Record<string, string>;
    getMethod(): string;
    getUrl(): string;
    getAuthMethod(): string;
    getContentType(): string;
    getQueryParams(): Record<string, string>;
    getUriParams(): null;
}
