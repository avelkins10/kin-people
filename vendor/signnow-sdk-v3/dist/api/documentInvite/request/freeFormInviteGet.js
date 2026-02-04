"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FreeFormInviteGet = void 0;
const constants_1 = require("../../../core/constants");
const constants_2 = require("../../../core/constants");
class FreeFormInviteGet {
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
        return '/v2/documents/{document_id}/free-form-invites';
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
exports.FreeFormInviteGet = FreeFormInviteGet;
