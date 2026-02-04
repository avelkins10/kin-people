import { BaseClass } from '../../../types/baseClass';
export declare class UserGet implements BaseClass {
    private queryParams;
    getPayload(): null;
    getMethod(): string;
    getUrl(): string;
    getAuthMethod(): string;
    getContentType(): string;
    getQueryParams(): Record<string, string>;
    getUriParams(): null;
}
