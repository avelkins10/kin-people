"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CancelFreeFormInvitePut = void 0;
const constants_1 = require("../../../core/constants");
const constants_2 = require("../../../core/constants");
class CancelFreeFormInvitePut {
    constructor(inviteId, reason = '') {
        this.inviteId = inviteId;
        this.reason = reason;
        this.queryParams = {};
    }
    getPayload() {
        return {
            invite_id: this.inviteId,
            reason: this.reason,
        };
    }
    getMethod() {
        return constants_1.HttpMethod.PUT;
    }
    getUrl() {
        return '/invite/{invite_id}/cancel';
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
            invite_id: this.inviteId,
        };
    }
}
exports.CancelFreeFormInvitePut = CancelFreeFormInvitePut;
