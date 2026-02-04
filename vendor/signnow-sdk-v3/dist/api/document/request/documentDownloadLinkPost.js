"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentDownloadLinkPost = void 0;
const constants_1 = require("../../../core/constants");
const constants_2 = require("../../../core/constants");
class DocumentDownloadLinkPost {
    constructor(documentId) {
        this.documentId = documentId;
        this.queryParams = {};
    }
    getPayload() {
        return {
            document_id: this.documentId,
        };
    }
    getMethod() {
        return constants_1.HttpMethod.POST;
    }
    getUrl() {
        return '/document/{document_id}/download/link';
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
exports.DocumentDownloadLinkPost = DocumentDownloadLinkPost;
