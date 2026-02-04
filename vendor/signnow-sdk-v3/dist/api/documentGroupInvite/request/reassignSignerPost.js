"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReassignSignerPost = void 0;
const constants_1 = require("../../../core/constants");
const constants_2 = require("../../../core/constants");
class ReassignSignerPost {
    constructor(documentGroupId, inviteId, stepId, userToUpdate, replaceWithThisUser = '', inviteEmail = {}, updateInviteActionAttributes = []) {
        this.documentGroupId = documentGroupId;
        this.inviteId = inviteId;
        this.stepId = stepId;
        this.userToUpdate = userToUpdate;
        this.replaceWithThisUser = replaceWithThisUser;
        this.inviteEmail = inviteEmail;
        this.updateInviteActionAttributes = updateInviteActionAttributes;
        this.queryParams = {};
    }
    getPayload() {
        return {
            document_group_id: this.documentGroupId,
            invite_id: this.inviteId,
            step_id: this.stepId,
            user_to_update: this.userToUpdate,
            replace_with_this_user: this.replaceWithThisUser,
            invite_email: this.inviteEmail,
            update_invite_action_attributes: this.updateInviteActionAttributes,
        };
    }
    getMethod() {
        return constants_1.HttpMethod.POST;
    }
    getUrl() {
        return '/documentgroup/{document_group_id}/groupinvite/{invite_id}/invitestep/{step_id}/update';
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
            step_id: this.stepId,
        };
    }
}
exports.ReassignSignerPost = ReassignSignerPost;
