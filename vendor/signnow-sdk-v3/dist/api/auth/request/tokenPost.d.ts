import { BaseClass } from '../../../types/baseClass';
export declare class TokenPost implements BaseClass {
    private username;
    private password;
    private grantType;
    private scope;
    private code;
    private queryParams;
    constructor(username: string, password: string, grantType: string, scope?: string, code?: string);
    getPayload(): Record<string, string>;
    getMethod(): string;
    getUrl(): string;
    getAuthMethod(): string;
    getContentType(): string;
    getQueryParams(): Record<string, string>;
    getUriParams(): null;
}
