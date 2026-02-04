import { BaseClass } from '../../../types/baseClass';
export declare class FolderDocumentsGet implements BaseClass {
    private folderId;
    private queryParams;
    constructor(folderId: string);
    getPayload(): Record<string, string>;
    getMethod(): string;
    getUrl(): string;
    getAuthMethod(): string;
    getContentType(): string;
    getQueryParams(): Record<string, string>;
    getUriParams(): {
        folder_id: string;
    };
}
