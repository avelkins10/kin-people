"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentDownloadGet = void 0;
const constants_1 = require("../../../core/constants");
const constants_2 = require("../../../core/constants");
class DocumentDownloadGet {
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
        return constants_1.HttpMethod.GET;
    }
    getUrl() {
        return '/document/{document_id}/download';
    }
    getAuthMethod() {
        return constants_2.HttpAuthType.BEARER;
    }
    getContentType() {
        return 'application/pdf';
    }
    getQueryParams() {
        return this.queryParams;
    }
    getUriParams() {
        return {
            document_id: this.documentId,
        };
    }
    withType(type) {
        this.queryParams['type'] = type;
        return this;
    }
    withHistory(withHistory) {
        this.queryParams['with_history'] = withHistory;
        return this;
    }
}
exports.DocumentDownloadGet = DocumentDownloadGet;
