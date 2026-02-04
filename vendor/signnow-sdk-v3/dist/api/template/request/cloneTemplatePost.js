"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CloneTemplatePost = void 0;
const constants_1 = require("../../../core/constants");
const constants_2 = require("../../../core/constants");
class CloneTemplatePost {
    constructor(templateId, documentName = null, clientTimestamp = null, folderId = null) {
        this.templateId = templateId;
        this.documentName = documentName;
        this.clientTimestamp = clientTimestamp;
        this.folderId = folderId;
        this.queryParams = {};
    }
    getPayload() {
        return {
            template_id: this.templateId,
            document_name: this.documentName,
            client_timestamp: this.clientTimestamp,
            folder_id: this.folderId,
        };
    }
    getMethod() {
        return constants_1.HttpMethod.POST;
    }
    getUrl() {
        return '/template/{template_id}/copy';
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
            template_id: this.templateId,
        };
    }
}
exports.CloneTemplatePost = CloneTemplatePost;
