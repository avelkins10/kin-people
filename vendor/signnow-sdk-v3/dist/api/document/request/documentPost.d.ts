import { BaseClass } from '../../../types/baseClass';
export declare class DocumentPost implements BaseClass {
    private file;
    private name;
    private checkFields;
    private saveFields;
    private makeTemplate;
    private password;
    private folderId;
    private originTemplateId;
    private clientTimestamp;
    private queryParams;
    constructor(file: string, name?: string, checkFields?: boolean, saveFields?: number, makeTemplate?: number, password?: string | null, folderId?: string | null, originTemplateId?: string | null, clientTimestamp?: number);
    getPayload(): Record<string, string | boolean | number | null>;
    getMethod(): string;
    getUrl(): string;
    getAuthMethod(): string;
    getContentType(): string;
    getQueryParams(): Record<string, string>;
    getUriParams(): null;
}
