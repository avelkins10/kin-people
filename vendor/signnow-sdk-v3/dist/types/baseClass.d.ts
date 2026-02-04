export interface BaseClass {
    getPayload(): Record<string, unknown> | null;
    getMethod(): string;
    getUrl(): string;
    getUriParams(): Record<string, string> | null;
    getQueryParams(): Record<string, string>;
    getAuthMethod(): string;
    getContentType(): string;
}
