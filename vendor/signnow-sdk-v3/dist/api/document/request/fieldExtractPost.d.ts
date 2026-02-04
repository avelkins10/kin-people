import { BaseClass } from '../../../types/baseClass';
import { Tag } from './data/tag/tag';
export declare class FieldExtractPost implements BaseClass {
    private file;
    private tags;
    private parseType;
    private password;
    private clientTimestamp;
    private queryParams;
    constructor(file: string, tags?: Tag[], parseType?: string, password?: string | null, clientTimestamp?: number);
    getPayload(): Record<string, string | Tag[] | null | number>;
    getMethod(): string;
    getUrl(): string;
    getAuthMethod(): string;
    getContentType(): string;
    getQueryParams(): Record<string, string>;
    getUriParams(): null;
}
