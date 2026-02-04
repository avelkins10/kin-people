import { BaseClass } from '../../../types/baseClass';
export declare class ResetPasswordPost implements BaseClass {
    private email;
    private queryParams;
    constructor(email: string);
    getPayload(): Record<string, string>;
    getMethod(): string;
    getUrl(): string;
    getAuthMethod(): string;
    getContentType(): string;
    getQueryParams(): Record<string, string>;
    getUriParams(): null;
}
