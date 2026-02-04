import { BaseClass } from '../../../types/baseClass';
export declare class DocumentGroupTemplatePost implements BaseClass {
    private templateGroupId;
    private groupName;
    private clientTimestamp;
    private folderId;
    private queryParams;
    constructor(templateGroupId: string, groupName: string, clientTimestamp?: string | null, folderId?: string | null);
    getPayload(): Record<string, string | null>;
    getMethod(): string;
    getUrl(): string;
    getAuthMethod(): string;
    getContentType(): string;
    getQueryParams(): Record<string, string>;
    getUriParams(): {
        template_group_id: string;
    };
}
