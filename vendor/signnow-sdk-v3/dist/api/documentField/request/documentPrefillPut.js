"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentPrefillPut = void 0;
const constants_1 = require("../../../core/constants");
const constants_2 = require("../../../core/constants");
class DocumentPrefillPut {
    constructor(documentId, fields) {
        this.documentId = documentId;
        this.fields = fields;
        this.queryParams = {};
    }
    getPayload() {
        return {
            document_id: this.documentId,
            fields: this.fields,
        };
    }
    getMethod() {
        return constants_1.HttpMethod.PUT;
    }
    getUrl() {
        return '/v2/documents/{document_id}/prefill-texts';
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
exports.DocumentPrefillPut = DocumentPrefillPut;
