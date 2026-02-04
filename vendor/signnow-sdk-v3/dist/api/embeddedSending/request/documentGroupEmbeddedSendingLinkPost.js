"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentGroupEmbeddedSendingLinkPost = void 0;
const constants_1 = require("../../../core/constants");
const constants_2 = require("../../../core/constants");
class DocumentGroupEmbeddedSendingLinkPost {
    constructor(documentGroupId, redirectUri = '', linkExpiration = 0, redirectTarget = '', type = 'manage') {
        this.documentGroupId = documentGroupId;
        this.redirectUri = redirectUri;
        this.linkExpiration = linkExpiration;
        this.redirectTarget = redirectTarget;
        this.type = type;
        this.queryParams = {};
    }
    getPayload() {
        return {
            document_group_id: this.documentGroupId,
            redirect_uri: this.redirectUri,
            link_expiration: this.linkExpiration,
            redirect_target: this.redirectTarget,
            type: this.type,
        };
    }
    getMethod() {
        return constants_1.HttpMethod.POST;
    }
    getUrl() {
        return '/v2/document-groups/{document_group_id}/embedded-sending';
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
exports.DocumentGroupEmbeddedSendingLinkPost = DocumentGroupEmbeddedSendingLinkPost;
