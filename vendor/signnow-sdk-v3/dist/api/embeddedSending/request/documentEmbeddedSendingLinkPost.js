"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentEmbeddedSendingLinkPost = void 0;
const constants_1 = require("../../../core/constants");
const constants_2 = require("../../../core/constants");
class DocumentEmbeddedSendingLinkPost {
    constructor(documentId, type, redirectUri = '', linkExpiration = 0, redirectTarget = '') {
        this.documentId = documentId;
        this.type = type;
        this.redirectUri = redirectUri;
        this.linkExpiration = linkExpiration;
        this.redirectTarget = redirectTarget;
        this.queryParams = {};
    }
    getPayload() {
        return {
            document_id: this.documentId,
            type: this.type,
            redirect_uri: this.redirectUri,
            link_expiration: this.linkExpiration,
            redirect_target: this.redirectTarget,
        };
    }
    getMethod() {
        return constants_1.HttpMethod.POST;
    }
    getUrl() {
        return '/v2/documents/{document_id}/embedded-sending';
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
exports.DocumentEmbeddedSendingLinkPost = DocumentEmbeddedSendingLinkPost;
