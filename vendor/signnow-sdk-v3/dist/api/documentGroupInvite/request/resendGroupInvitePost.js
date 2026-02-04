"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResendGroupInvitePost = void 0;
const constants_1 = require("../../../core/constants");
const constants_2 = require("../../../core/constants");
class ResendGroupInvitePost {
    constructor(documentGroupId, inviteId, email = '') {
        this.documentGroupId = documentGroupId;
        this.inviteId = inviteId;
        this.email = email;
        this.queryParams = {};
    }
    getPayload() {
        return {
            document_group_id: this.documentGroupId,
            invite_id: this.inviteId,
            email: this.email,
        };
    }
    getMethod() {
        return constants_1.HttpMethod.POST;
    }
    getUrl() {
        return '/documentgroup/{document_group_id}/groupinvite/{invite_id}/resendinvites';
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
exports.ResendGroupInvitePost = ResendGroupInvitePost;
