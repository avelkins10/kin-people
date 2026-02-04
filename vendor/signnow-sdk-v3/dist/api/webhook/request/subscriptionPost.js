"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubscriptionPost = void 0;
const constants_1 = require("../../../core/constants");
const constants_2 = require("../../../core/constants");
class SubscriptionPost {
    constructor(event, entityId, action = '', attributes = { callback: '' }, secretKey = '') {
        this.event = event;
        this.entityId = entityId;
        this.action = action;
        this.attributes = attributes;
        this.secretKey = secretKey;
        this.queryParams = {};
    }
    getPayload() {
        return {
            event: this.event,
            entity_id: this.entityId,
            action: this.action,
            attributes: this.attributes,
            secret_key: this.secretKey,
        };
    }
    getMethod() {
        return constants_1.HttpMethod.POST;
    }
    getUrl() {
        return '/api/v2/events';
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
        return null;
    }
}
exports.SubscriptionPost = SubscriptionPost;
