"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentPrefillSmartFieldPost = void 0;
const constants_1 = require("../../../core/constants");
const constants_2 = require("../../../core/constants");
class DocumentPrefillSmartFieldPost {
    constructor(documentId, data, clientTimestamp) {
        this.documentId = documentId;
        this.data = data;
        this.clientTimestamp = clientTimestamp;
        this.queryParams = {};
    }
    getPayload() {
        return {
            document_id: this.documentId,
            data: this.data,
            client_timestamp: this.clientTimestamp,
        };
    }
    getMethod() {
        return constants_1.HttpMethod.POST;
    }
    getUrl() {
        return '/document/{document_id}/integration/object/smartfields';
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
exports.DocumentPrefillSmartFieldPost = DocumentPrefillSmartFieldPost;
