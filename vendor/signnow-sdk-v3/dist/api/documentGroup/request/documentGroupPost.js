"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentGroupPost = void 0;
const constants_1 = require("../../../core/constants");
const constants_2 = require("../../../core/constants");
class DocumentGroupPost {
    constructor(documentIds, groupName) {
        this.documentIds = documentIds;
        this.groupName = groupName;
        this.queryParams = {};
    }
    getPayload() {
        return {
            document_ids: this.documentIds,
            group_name: this.groupName,
        };
    }
    getMethod() {
        return constants_1.HttpMethod.POST;
    }
    getUrl() {
        return '/documentgroup';
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
exports.DocumentGroupPost = DocumentGroupPost;
