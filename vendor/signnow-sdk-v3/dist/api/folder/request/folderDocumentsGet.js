"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FolderDocumentsGet = void 0;
const constants_1 = require("../../../core/constants");
const constants_2 = require("../../../core/constants");
class FolderDocumentsGet {
    constructor(folderId) {
        this.folderId = folderId;
        this.queryParams = {};
    }
    getPayload() {
        return {
            folder_id: this.folderId,
        };
    }
    getMethod() {
        return constants_1.HttpMethod.GET;
    }
    getUrl() {
        return '/folder/{folder_id}';
    }
    getAuthMethod() {
        return constants_2.HttpAuthType.BEARER;
    }
    getContentType() {
        return 'application/json';
    }
    getQueryParams() {
        return this.queryParams;
    }
    getUriParams() {
        return {
            folder_id: this.folderId,
        };
    }
}
exports.FolderDocumentsGet = FolderDocumentsGet;
