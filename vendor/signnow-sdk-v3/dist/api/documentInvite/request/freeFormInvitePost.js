"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FreeFormInvitePost = void 0;
const constants_1 = require("../../../core/constants");
const constants_2 = require("../../../core/constants");
class FreeFormInvitePost {
    constructor(documentId, to, from = null, cc = [], subject = null, message = null, ccSubject = null, ccMessage = null, language = null, clientTimestamp = null, callbackUrl = null, isFirstInviteInSequence = null, redirectUri = null, closeRedirectUri = null, redirectTarget = '') {
        this.documentId = documentId;
        this.to = to;
        this.from = from;
        this.cc = cc;
        this.subject = subject;
        this.message = message;
        this.ccSubject = ccSubject;
        this.ccMessage = ccMessage;
        this.language = language;
        this.clientTimestamp = clientTimestamp;
        this.callbackUrl = callbackUrl;
        this.isFirstInviteInSequence = isFirstInviteInSequence;
        this.redirectUri = redirectUri;
        this.closeRedirectUri = closeRedirectUri;
        this.redirectTarget = redirectTarget;
        this.queryParams = {};
    }
    getPayload() {
        return {
            document_id: this.documentId,
            to: this.to,
            from: this.from,
            cc: this.cc,
            subject: this.subject,
            message: this.message,
            cc_subject: this.ccSubject,
            cc_message: this.ccMessage,
            language: this.language,
            client_timestamp: this.clientTimestamp,
            callback_url: this.callbackUrl,
            is_first_invite_in_sequence: this.isFirstInviteInSequence,
            redirect_uri: this.redirectUri,
            close_redirect_uri: this.closeRedirectUri,
            redirect_target: this.redirectTarget,
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
exports.FreeFormInvitePost = FreeFormInvitePost;
