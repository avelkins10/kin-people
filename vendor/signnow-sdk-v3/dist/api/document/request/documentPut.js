"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentPut = void 0;
const constants_1 = require("../../../core/constants");
const constants_2 = require("../../../core/constants");
class DocumentPut {
    constructor(documentId, fields, lines = [], checks = [], radiobuttons = [], signatures = [], texts = [], attachments = [], hyperlinks = [], integrationObjects = [], deactivateElements = [], documentName = null, clientTimestamp = '') {
        this.documentId = documentId;
        this.fields = fields;
        this.lines = lines;
        this.checks = checks;
        this.radiobuttons = radiobuttons;
        this.signatures = signatures;
        this.texts = texts;
        this.attachments = attachments;
        this.hyperlinks = hyperlinks;
        this.integrationObjects = integrationObjects;
        this.deactivateElements = deactivateElements;
        this.documentName = documentName;
        this.clientTimestamp = clientTimestamp;
        this.queryParams = {};
    }
    getPayload() {
        return {
            document_id: this.documentId,
            fields: this.fields,
            lines: this.lines,
            checks: this.checks,
            radiobuttons: this.radiobuttons,
            signatures: this.signatures,
            texts: this.texts,
            attachments: this.attachments,
            hyperlinks: this.hyperlinks,
            integration_objects: this.integrationObjects,
            deactivate_elements: this.deactivateElements,
            document_name: this.documentName,
            client_timestamp: this.clientTimestamp,
        };
    }
    getMethod() {
        return constants_1.HttpMethod.PUT;
    }
    getUrl() {
        return '/document/{document_id}';
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
exports.DocumentPut = DocumentPut;
