"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentInviteLinkPost = void 0;
const constants_1 = require("../../../core/constants");
const constants_2 = require("../../../core/constants");
class DocumentInviteLinkPost {
    constructor(documentId, fieldInviteId, authMethod = '', linkExpiration = 0) {
        this.documentId = documentId;
        this.fieldInviteId = fieldInviteId;
        this.authMethod = authMethod;
        this.linkExpiration = linkExpiration;
        this.queryParams = {};
    }
    getPayload() {
        return {
            document_id: this.documentId,
            field_invite_id: this.fieldInviteId,
            auth_method: this.authMethod,
            link_expiration: this.linkExpiration,
        };
    }
    getMethod() {
        return constants_1.HttpMethod.POST;
    }
    getUrl() {
        return '/v2/documents/{document_id}/embedded-invites/{field_invite_id}/link';
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
            field_invite_id: this.fieldInviteId,
        };
    }
}
exports.DocumentInviteLinkPost = DocumentInviteLinkPost;
