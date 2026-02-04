"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GroupInvitePost = void 0;
const constants_1 = require("../../../core/constants");
const constants_2 = require("../../../core/constants");
class GroupInvitePost {
    constructor(documentGroupId, invites, signAsMerged) {
        this.documentGroupId = documentGroupId;
        this.invites = invites;
        this.signAsMerged = signAsMerged;
        this.queryParams = {};
    }
    getPayload() {
        return {
            document_group_id: this.documentGroupId,
            invites: this.invites,
            sign_as_merged: this.signAsMerged,
        };
    }
    getMethod() {
        return constants_1.HttpMethod.POST;
    }
    getUrl() {
        return '/v2/document-groups/{document_group_id}/embedded-invites';
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
