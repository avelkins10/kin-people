"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GroupInvitePost = void 0;
const constants_1 = require("../../../core/constants");
const constants_2 = require("../../../core/constants");
class GroupInvitePost {
    constructor(documentGroupId, inviteSteps, cc, emailGroups = [], completionEmails = [], signAsMerged = true, clientTimestamp = 0, ccSubject = '', ccMessage = '') {
        this.documentGroupId = documentGroupId;
        this.inviteSteps = inviteSteps;
        this.cc = cc;
        this.emailGroups = emailGroups;
        this.completionEmails = completionEmails;
        this.signAsMerged = signAsMerged;
        this.clientTimestamp = clientTimestamp;
        this.ccSubject = ccSubject;
        this.ccMessage = ccMessage;
        this.queryParams = {};
    }
    getPayload() {
        return {
            document_group_id: this.documentGroupId,
            invite_steps: this.inviteSteps,
            email_groups: this.emailGroups,
            completion_emails: this.completionEmails,
            sign_as_merged: this.signAsMerged,
            client_timestamp: this.clientTimestamp,
            cc: this.cc,
            cc_subject: this.ccSubject,
            cc_message: this.ccMessage,
        };
    }
    getMethod() {
        return constants_1.HttpMethod.POST;
    }
    getUrl() {
        return '/documentgroup/{document_group_id}/groupinvite';
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
exports.GroupInvitePost = GroupInvitePost;
