"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentGroupRecipientsGet = void 0;
const constants_1 = require("../../../core/constants");
const constants_2 = require("../../../core/constants");
class DocumentGroupRecipientsGet {
    constructor(documentGroupId) {
        this.documentGroupId = documentGroupId;
        this.queryParams = {};
    }
    getPayload() {
        return {
            document_group_id: this.documentGroupId,
        };
    }
    getMethod() {
        return constants_1.HttpMethod.GET;
    }
    getUrl() {
        return '/v2/document-groups/{document_group_id}/recipients';
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
            document_group_id: this.documentGroupId,
        };
    }
}
exports.DocumentGroupRecipientsGet = DocumentGroupRecipientsGet;
