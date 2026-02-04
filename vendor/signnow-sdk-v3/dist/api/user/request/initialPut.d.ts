import { BaseClass } from '../../../types/baseClass';
export declare class InitialPut implements BaseClass {
    private data;
    private queryParams;
    constructor(data: string);
    getPayload(): Record<string, string>;
    getMethod(): string;
    getUrl(): string;
    getAuthMethod(): string;
    getContentType(): string;
    getQueryParams(): Record<string, string>;
    getUriParams(): null;
}
