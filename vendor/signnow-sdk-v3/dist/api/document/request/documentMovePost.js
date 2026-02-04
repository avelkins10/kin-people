"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentMovePost = void 0;
const constants_1 = require("../../../core/constants");
const constants_2 = require("../../../core/constants");
class DocumentMovePost {
    constructor(documentId, folderId) {
        this.documentId = documentId;
        this.folderId = folderId;
        this.queryParams = {};
    }
    getPayload() {
        return {
            document_id: this.documentId,
            folder_id: this.folderId,
        };
    }
    getMethod() {
        return constants_1.HttpMethod.POST;
    }
    getUrl() {
        return '/document/{document_id}/move';
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
            document_id: this.documentId,
        };
    }
}
exports.DocumentMovePost = DocumentMovePost;
