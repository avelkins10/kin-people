import { BaseClass } from '../../../types/baseClass';
export declare class RefreshTokenPost implements BaseClass {
    private refreshToken;
    private scope;
    private expirationTime;
    private grantType;
    private queryParams;
    constructor(refreshToken: string, scope?: string, expirationTime?: string, grantType?: string);
    getPayload(): Record<string, string>;
    getMethod(): string;
    getUrl(): string;
    getAuthMethod(): string;
    getContentType(): string;
    getQueryParams(): Record<string, string>;
    getUriParams(): null;
}
