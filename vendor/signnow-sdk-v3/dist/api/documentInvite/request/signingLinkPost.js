"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SigningLinkPost = void 0;
const constants_1 = require("../../../core/constants");
const constants_2 = require("../../../core/constants");
class SigningLinkPost {
    constructor(documentId, redirectUri = '') {
        this.documentId = documentId;
        this.redirectUri = redirectUri;
        this.queryParams = {};
    }
    getPayload() {
        return {
            document_id: this.documentId,
            redirect_uri: this.redirectUri,
        };
    }
    getMethod() {
        return constants_1.HttpMethod.POST;
    }
    getUrl() {
        return '/link';
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
        return null;
    }
}
exports.SigningLinkPost = SigningLinkPost;
