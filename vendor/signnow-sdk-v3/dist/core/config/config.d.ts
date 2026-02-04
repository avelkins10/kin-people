export declare class Config {
    private SIGNNOW_API_HOST;
    private SIGNNOW_API_BASIC_TOKEN;
    private SIGNNOW_API_USERNAME;
    private SIGNNOW_API_PASSWORD;
    private SIGNNOW_DOWNLOADS_DIR;
    constructor(SIGNNOW_API_HOST?: string, SIGNNOW_API_BASIC_TOKEN?: string, SIGNNOW_API_USERNAME?: string, SIGNNOW_API_PASSWORD?: string, SIGNNOW_DOWNLOADS_DIR?: string);
    getApiHost(): string;
    getApiBasicToken(): string;
    getApiUsername(): string;
    getApiPassword(): string;
    getDownloadDirectory(): string;
    getClientName(): string;
}
