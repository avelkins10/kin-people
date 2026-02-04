import { Response } from 'node-fetch';
import { Config } from '../config/config';
export declare class FileDownloader {
    private readonly config;
    private readonly SANITIZE_FILENAME_REGEX;
    private readonly FILENAME_DISPOSITION_REGEX;
    private readonly contentTypeMap;
    constructor(config: Config);
    downloadFile(response: Response): Promise<string>;
    getExtensionFromContentType(contentType: string): string;
    generateFileName(contentType: string): string;
    private extractFilenameFromHeaders;
    private sanitizeFilename;
    private ensureDownloadDirectory;
    private getBufferFromResponse;
    private saveBufferToFile;
}
