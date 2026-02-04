"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentInvitePost = void 0;
const constants_1 = require("../../../core/constants");
const constants_2 = require("../../../core/constants");
class DocumentInvitePost {
    constructor(documentId, invites, nameFormula = '') {
        this.documentId = documentId;
        this.invites = invites;
        this.nameFormula = nameFormula;
        this.queryParams = {};
    }
    getPayload() {
        return {
            document_id: this.documentId,
            name_formula: this.nameFormula,
            invites: this.invites,
        };
    }
    getMethod() {
        return constants_1.HttpMethod.POST;
    }
    getUrl() {
        return '/v2/documents/{document_id}/embedded-invites';
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
exports.DocumentInvitePost = DocumentInvitePost;
