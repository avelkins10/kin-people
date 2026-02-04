import { BaseClass } from '../../../types/baseClass';
export declare class EmailVerifyPut implements BaseClass {
    private email;
    private verificationToken;
    private queryParams;
    constructor(email: string, verificationToken: string);
    getPayload(): Record<string, string>;
    getMethod(): string;
    getUrl(): string;
    getAuthMethod(): string;
    getContentType(): string;
    getQueryParams(): Record<string, string>;
    getUriParams(): null;
}
