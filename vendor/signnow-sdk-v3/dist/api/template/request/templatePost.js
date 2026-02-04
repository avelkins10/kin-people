"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TemplatePost = void 0;
const constants_1 = require("../../../core/constants");
const constants_2 = require("../../../core/constants");
class TemplatePost {
    constructor(documentId, documentName) {
        this.documentId = documentId;
        this.documentName = documentName;
        this.queryParams = {};
    }
    getPayload() {
        return {
            document_id: this.documentId,
            document_name: this.documentName,
        };
    }
    getMethod() {
        return constants_1.HttpMethod.POST;
    }
    getUrl() {
        return '/template';
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
exports.TemplatePost = TemplatePost;
