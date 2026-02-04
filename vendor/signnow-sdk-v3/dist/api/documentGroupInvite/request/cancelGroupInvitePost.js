"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CancelGroupInvitePost = void 0;
const constants_1 = require("../../../core/constants");
const constants_2 = require("../../../core/constants");
class CancelGroupInvitePost {
    constructor(documentGroupId, inviteId) {
        this.documentGroupId = documentGroupId;
        this.inviteId = inviteId;
        this.queryParams = {};
    }
    getPayload() {
        return {
            document_group_id: this.documentGroupId,
            invite_id: this.inviteId,
        };
    }
    getMethod() {
        return constants_1.HttpMethod.POST;
    }
    getUrl() {
        return '/documentgroup/{document_group_id}/groupinvite/{invite_id}/cancelinvite';
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
            invite_id: this.inviteId,
        };
    }
}
exports.CancelGroupInvitePost = CancelGroupInvitePost;
