"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenGet = void 0;
const constants_1 = require("../../../core/constants");
const constants_2 = require("../../../core/constants");
class TokenGet {
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
        return '/oauth2/token';
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
exports.TokenGet = TokenGet;
