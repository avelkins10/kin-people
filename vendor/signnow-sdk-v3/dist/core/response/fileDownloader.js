"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileDownloader = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const crypto_1 = require("crypto");
class FileDownloader {
    constructor(config) {
        this.config = config;
        this.SANITIZE_FILENAME_REGEX = /[/\\?%*:|"<>]/g;
        this.FILENAME_DISPOSITION_REGEX = {
            extended: /filename\*?=['"]?(?:UTF-\d['"]?)?([^;\r\n"']*)['"]?;?/i,
            standard: /filename=['"]?([^;\r\n"']*)['"]?;?/i
        };
        this.contentTypeMap = {
            'application/pdf': '.pdf',
            'application/zip': '.zip'
        };
    }
    async downloadFile(response) {
        const buffer = await this.getBufferFromResponse(response);
        const downloadDir = this.ensureDownloadDirectory();
        const contentType = response.headers.get('content-type') || '';
        let filename = this.extractFilenameFromHeaders(response);
        if (!filename) {
            filename = this.generateFileName(contentType);
        }
        else if (!path_1.default.extname(filename)) {
            const extension = this.getExtensionFromContentType(contentType);
            filename = `${filename}${extension}`;
        }
        const filePath = path_1.default.join(downloadDir, filename);
        this.saveBufferToFile(filePath, buffer);
        return filePath;
    }
    getExtensionFromContentType(contentType) {
        for (const [type, extension] of Object.entries(this.contentTypeMap)) {
            if (contentType.includes(type)) {
                return extension;
            }
        }
        return '.bin';
    }
    generateFileName(contentType) {
        const timestamp = Date.now();
        const randomString = (0, crypto_1.randomBytes)(8).toString('hex');
        const extension = this.getExtensionFromContentType(contentType);
        return `document_${timestamp}_${randomString}${extension}`;
    }
    extractFilenameFromHeaders(response) {
        const contentDisposition = response.headers.get('content-disposition');
        if (!contentDisposition) {
            return '';
        }
        const filenameMatch = contentDisposition.match(this.FILENAME_DISPOSITION_REGEX.extended) ||
            contentDisposition.match(this.FILENAME_DISPOSITION_REGEX.standard);
        if (filenameMatch && filenameMatch[1]) {
            return this.sanitizeFilename(decodeURIComponent(filenameMatch[1].trim()));
        }
        return '';
    }
    sanitizeFilename(filename) {
        return filename.replace(this.SANITIZE_FILENAME_REGEX, '_');
    }
    ensureDownloadDirectory() {
        const downloadDir = this.config.getDownloadDirectory();
        if (!fs_1.default.existsSync(downloadDir)) {
            fs_1.default.mkdirSync(downloadDir, { recursive: true });
        }
        return downloadDir;
    }
    async getBufferFromResponse(response) {
        const blob = await response.blob();
        return Buffer.from(await blob.arrayBuffer());
    }
    saveBufferToFile(filePath, buffer) {
        fs_1.default.writeFileSync(filePath, buffer);
    }
}
exports.FileDownloader = FileDownloader;
