"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventSubscriptionPut = void 0;
const constants_1 = require("../../../core/constants");
const constants_2 = require("../../../core/constants");
class EventSubscriptionPut {
    constructor(eventSubscriptionId, event, entityId, action, attributes) {
        this.eventSubscriptionId = eventSubscriptionId;
        this.event = event;
        this.entityId = entityId;
        this.action = action;
        this.attributes = attributes;
        this.queryParams = {};
    }
    getPayload() {
        return {
            event_subscription_id: this.eventSubscriptionId,
            event: this.event,
            entity_id: this.entityId,
            action: this.action,
            attributes: this.attributes,
        };
    }
    getMethod() {
        return constants_1.HttpMethod.PUT;
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
exports.EventSubscriptionPut = EventSubscriptionPut;
