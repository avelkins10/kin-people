import { BaseClass } from '../../../types/baseClass';
export declare class UserPost implements BaseClass {
    private email;
    private password;
    private firstName;
    private lastName;
    private number;
    private queryParams;
    constructor(email: string, password: string, firstName?: string, lastName?: string, number?: string);
    getPayload(): Record<string, string>;
    getMethod(): string;
    getUrl(): string;
    getAuthMethod(): string;
    getContentType(): string;
    getQueryParams(): Record<string, string>;
    getUriParams(): null;
}
