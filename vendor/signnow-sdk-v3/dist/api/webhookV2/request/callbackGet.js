"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CallbackGet = void 0;
const constants_1 = require("../../../core/constants");
const constants_2 = require("../../../core/constants");
class CallbackGet {
    constructor(eventSubscriptionId, callbackId) {
        this.eventSubscriptionId = eventSubscriptionId;
        this.callbackId = callbackId;
        this.queryParams = {};
    }
    getPayload() {
        return {
            event_subscription_id: this.eventSubscriptionId,
            callback_id: this.callbackId,
        };
    }
    getMethod() {
        return constants_1.HttpMethod.GET;
    }
    getUrl() {
        return '/v2/event-subscriptions/{event_subscription_id}/callbacks/{callback_id}';
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
            event_subscription_id: this.eventSubscriptionId,
            callback_id: this.callbackId,
        };
    }
}
exports.CallbackGet = CallbackGet;
