import { BaseClass } from '../types/baseClass';
export declare class ApiClient {
    private bearerToken?;
    private headers?;
    private readonly config;
    private readonly fileDownloader;
    constructor(bearerToken?: string | undefined, headers?: Record<string, string> | undefined);
    setBearerToken(bearerToken: string): void;
    getBearerToken(): string | undefined;
    send<T>(request: BaseClass): Promise<T>;
    private makeRequest;
    private isSuccessWithNoContent;
    private validateResponse;
    private buildUri;
    private getHeaders;
    private getBody;
    private clearPayload;
    private createUrlEncodedBody;
    private createMultipartFormBody;
    private isFileContentType;
    private appendQueryParams;
}
