"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentMergePost = void 0;
const constants_1 = require("../../../core/constants");
const constants_2 = require("../../../core/constants");
class DocumentMergePost {
    constructor(name, documentIds = [], uploadDocument = false) {
        this.name = name;
        this.documentIds = documentIds;
        this.uploadDocument = uploadDocument;
        this.queryParams = {};
    }
    getPayload() {
        return {
            name: this.name,
            document_ids: this.documentIds,
            upload_document: this.uploadDocument,
        };
    }
    getMethod() {
        return constants_1.HttpMethod.POST;
    }
    getUrl() {
        return '/document/merge';
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
        return null;
    }
}
exports.DocumentMergePost = DocumentMergePost;
