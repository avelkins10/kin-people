import { BaseClass } from '../../../types/baseClass';
export declare class GroupTemplateGet implements BaseClass {
    private templateId;
    private queryParams;
    constructor(templateId: string);
    getPayload(): Record<string, string>;
    getMethod(): string;
    getUrl(): string;
    getAuthMethod(): string;
    getContentType(): string;
    getQueryParams(): Record<string, string>;
    getUriParams(): {
        template_id: string;
    };
}
