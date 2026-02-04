"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubscriptionGet = void 0;
const constants_1 = require("../../../core/constants");
const constants_2 = require("../../../core/constants");
class SubscriptionGet {
    constructor() {
        this.queryParams = {};
    }
    getPayload() {
        return null;
    }
    getMethod() {
        return constants_1.HttpMethod.GET;
    }
    getUrl() {
        return '/api/v2/events';
    }
    getAuthMethod() {
        return constants_2.HttpAuthType.BASIC;
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
exports.SubscriptionGet = SubscriptionGet;
