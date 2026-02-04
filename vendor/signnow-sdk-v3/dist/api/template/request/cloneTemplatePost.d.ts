import { BaseClass } from '../../../types/baseClass';
export declare class CloneTemplatePost implements BaseClass {
    private templateId;
    private documentName;
    private clientTimestamp;
    private folderId;
    private queryParams;
    constructor(templateId: string, documentName?: string | null, clientTimestamp?: string | null, folderId?: string | null);
    getPayload(): Record<string, string | null>;
    getMethod(): string;
    getUrl(): string;
    getAuthMethod(): string;
    getContentType(): string;
    getQueryParams(): Record<string, string>;
    getUriParams(): {
        template_id: string;
    };
}
