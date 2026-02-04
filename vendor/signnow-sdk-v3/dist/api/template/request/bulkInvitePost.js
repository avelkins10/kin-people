"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BulkInvitePost = void 0;
const constants_1 = require("../../../core/constants");
const constants_2 = require("../../../core/constants");
class BulkInvitePost {
    constructor(documentId, file, folderId, clientTimestamp = 0, documentName = '', subject = '', emailMessage = '') {
        this.documentId = documentId;
        this.file = file;
        this.folderId = folderId;
        this.clientTimestamp = clientTimestamp;
        this.documentName = documentName;
        this.subject = subject;
        this.emailMessage = emailMessage;
        this.queryParams = {};
    }
    getPayload() {
        return {
            document_id: this.documentId,
            file: this.file,
            folder_id: this.folderId,
            client_timestamp: this.clientTimestamp,
            document_name: this.documentName,
            subject: this.subject,
            email_message: this.emailMessage,
        };
    }
    getMethod() {
        return constants_1.HttpMethod.POST;
    }
    getUrl() {
        return '/template/{document_id}/bulkinvite';
    }
    getAuthMethod() {
        return constants_2.HttpAuthType.BEARER;
    }
    getContentType() {
        return 'multipart/form-data';
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
exports.BulkInvitePost = BulkInvitePost;
