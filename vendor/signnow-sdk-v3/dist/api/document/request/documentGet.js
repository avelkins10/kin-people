"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentGet = void 0;
const constants_1 = require("../../../core/constants");
const constants_2 = require("../../../core/constants");
class DocumentGet {
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
        return '/document/{document_id}';
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
exports.DocumentGet = DocumentGet;
