"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventSubscriptionDelete = void 0;
const constants_1 = require("../../../core/constants");
const constants_2 = require("../../../core/constants");
class EventSubscriptionDelete {
    constructor(eventSubscriptionId) {
        this.eventSubscriptionId = eventSubscriptionId;
        this.queryParams = {};
    }
    getPayload() {
        return {
            event_subscription_id: this.eventSubscriptionId,
        };
    }
    getMethod() {
        return constants_1.HttpMethod.DELETE;
    }
    getUrl() {
        return '/v2/event-subscriptions/{event_subscription_id}';
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
        };
    }
}
exports.EventSubscriptionDelete = EventSubscriptionDelete;
