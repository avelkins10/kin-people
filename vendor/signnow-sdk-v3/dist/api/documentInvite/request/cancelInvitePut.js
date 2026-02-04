"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CancelInvitePut = void 0;
const constants_1 = require("../../../core/constants");
const constants_2 = require("../../../core/constants");
class CancelInvitePut {
    constructor(documentId, reason) {
        this.documentId = documentId;
        this.reason = reason;
        this.queryParams = {};
    }
    getPayload() {
        return {
            document_id: this.documentId,
            reason: this.reason,
        };
    }
    getMethod() {
        return constants_1.HttpMethod.PUT;
    }
    getUrl() {
        return '/document/{document_id}/fieldinvitecancel';
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
exports.CancelInvitePut = CancelInvitePut;
