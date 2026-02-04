import { ApiClient } from './apiClient';
export declare class Sdk {
    private API_VERSION;
    private GRANT_TYPE_PASSWORD;
    private apiClient;
    private config;
    constructor();
    authenticate(username?: string, password?: string): Promise<Sdk>;
    version(): string;
    getClient(): ApiClient;
    actualBearerToken(): string | undefined;
    setBearerToken(bearerToken: string): Sdk;
}
