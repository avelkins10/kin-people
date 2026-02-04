import { BaseClass } from '../../../types/baseClass';
export declare class UserPut implements BaseClass {
    private firstName;
    private lastName;
    private password;
    private oldPassword;
    private logoutAll;
    private queryParams;
    constructor(firstName: string, lastName: string, password?: string, oldPassword?: string, logoutAll?: string);
    getPayload(): Record<string, string>;
    getMethod(): string;
    getUrl(): string;
    getAuthMethod(): string;
    getContentType(): string;
    getQueryParams(): Record<string, string>;
    getUriParams(): null;
}
