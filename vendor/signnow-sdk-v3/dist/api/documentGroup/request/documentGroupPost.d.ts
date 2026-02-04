import { BaseClass } from '../../../types/baseClass';
export declare class DocumentGroupPost implements BaseClass {
    private documentIds;
    private groupName;
    private queryParams;
    constructor(documentIds: string[], groupName: string);
    getPayload(): Record<string, string[] | string>;
    getMethod(): string;
    getUrl(): string;
    getAuthMethod(): string;
    getContentType(): string;
    getQueryParams(): Record<string, string>;
    getUriParams(): null;
}
