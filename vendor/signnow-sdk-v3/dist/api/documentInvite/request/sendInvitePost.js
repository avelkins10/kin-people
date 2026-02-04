"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SendInvitePost = void 0;
const constants_1 = require("../../../core/constants");
const constants_2 = require("../../../core/constants");
class SendInvitePost {
    constructor(documentId, to, from, subject, message, emailGroups = [], cc = [], ccStep = [], viewers = [], ccSubject = '', ccMessage = '') {
        this.documentId = documentId;
        this.to = to;
        this.from = from;
        this.subject = subject;
        this.message = message;
        this.emailGroups = emailGroups;
        this.cc = cc;
        this.ccStep = ccStep;
        this.viewers = viewers;
        this.ccSubject = ccSubject;
        this.ccMessage = ccMessage;
        this.queryParams = {};
    }
    getPayload() {
        return {
            document_id: this.documentId,
            to: this.to,
            from: this.from,
            email_groups: this.emailGroups,
            cc: this.cc,
            cc_step: this.ccStep,
            viewers: this.viewers,
            subject: this.subject,
            message: this.message,
            cc_subject: this.ccSubject,
            cc_message: this.ccMessage,
        };
    }
    getMethod() {
        return constants_1.HttpMethod.POST;
    }
    getUrl() {
        return '/document/{document_id}/invite';
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
exports.SendInvitePost = SendInvitePost;
