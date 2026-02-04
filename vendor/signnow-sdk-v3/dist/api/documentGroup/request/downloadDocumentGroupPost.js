"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DownloadDocumentGroupPost = void 0;
const constants_1 = require("../../../core/constants");
const constants_2 = require("../../../core/constants");
class DownloadDocumentGroupPost {
    constructor(documentGroupId, type, withHistory, documentOrder = []) {
        this.documentGroupId = documentGroupId;
        this.type = type;
        this.withHistory = withHistory;
        this.documentOrder = documentOrder;
        this.queryParams = {};
    }
    getPayload() {
        return {
            document_group_id: this.documentGroupId,
            type: this.type,
            with_history: this.withHistory,
            document_order: this.documentOrder,
        };
    }
    getMethod() {
        return constants_1.HttpMethod.POST;
    }
    getUrl() {
        return '/documentgroup/{document_group_id}/downloadall';
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
exports.DownloadDocumentGroupPost = DownloadDocumentGroupPost;
