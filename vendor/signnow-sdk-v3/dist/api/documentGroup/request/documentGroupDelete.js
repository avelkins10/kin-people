"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentGroupDelete = void 0;
const constants_1 = require("../../../core/constants");
const constants_2 = require("../../../core/constants");
class DocumentGroupDelete {
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
        return constants_1.HttpMethod.DELETE;
    }
    getUrl() {
        return '/documentgroup/{document_group_id}';
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
exports.DocumentGroupDelete = DocumentGroupDelete;
