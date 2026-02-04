import { BaseClass } from '../../../types/baseClass';
export declare class DocumentGroupDelete implements BaseClass {
    private documentGroupId;
    private queryParams;
    constructor(documentGroupId: string);
    getPayload(): Record<string, string>;
    getMethod(): string;
    getUrl(): string;
    getAuthMethod(): string;
    getContentType(): string;
    getQueryParams(): Record<string, string>;
    getUriParams(): {
        document_group_id: string;
    };
}
