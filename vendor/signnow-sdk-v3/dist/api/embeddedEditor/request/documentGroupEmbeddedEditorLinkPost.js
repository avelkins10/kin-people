"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentGroupEmbeddedEditorLinkPost = void 0;
const constants_1 = require("../../../core/constants");
const constants_2 = require("../../../core/constants");
class DocumentGroupEmbeddedEditorLinkPost {
    constructor(documentGroupId, redirectUri = '', redirectTarget = '', linkExpiration = 0) {
        this.documentGroupId = documentGroupId;
        this.redirectUri = redirectUri;
        this.redirectTarget = redirectTarget;
        this.linkExpiration = linkExpiration;
        this.queryParams = {};
    }
    getPayload() {
        return {
            document_group_id: this.documentGroupId,
            redirect_uri: this.redirectUri,
            redirect_target: this.redirectTarget,
            link_expiration: this.linkExpiration,
        };
    }
    getMethod() {
        return constants_1.HttpMethod.POST;
    }
    getUrl() {
        return '/v2/document-groups/{document_group_id}/embedded-editor';
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
exports.DocumentGroupEmbeddedEditorLinkPost = DocumentGroupEmbeddedEditorLinkPost;
