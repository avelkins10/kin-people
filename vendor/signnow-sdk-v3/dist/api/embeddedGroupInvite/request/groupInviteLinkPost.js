"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GroupInviteLinkPost = void 0;
const constants_1 = require("../../../core/constants");
const constants_2 = require("../../../core/constants");
class GroupInviteLinkPost {
    constructor(documentGroupId, embeddedInviteId, email = '', authMethod = '', linkExpiration = 0) {
        this.documentGroupId = documentGroupId;
        this.embeddedInviteId = embeddedInviteId;
        this.email = email;
        this.authMethod = authMethod;
        this.linkExpiration = linkExpiration;
        this.queryParams = {};
    }
    getPayload() {
        return {
            document_group_id: this.documentGroupId,
            embedded_invite_id: this.embeddedInviteId,
            email: this.email,
            auth_method: this.authMethod,
            link_expiration: this.linkExpiration,
        };
    }
    getMethod() {
        return constants_1.HttpMethod.POST;
    }
    getUrl() {
        return '/v2/document-groups/{document_group_id}/embedded-invites/{embedded_invite_id}/link';
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
            embedded_invite_id: this.embeddedInviteId,
        };
    }
}
exports.GroupInviteLinkPost = GroupInviteLinkPost;
