"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RefreshTokenPost = void 0;
const constants_1 = require("../../../core/constants");
const constants_2 = require("../../../core/constants");
class RefreshTokenPost {
    constructor(refreshToken, scope = '*', expirationTime = '', grantType = 'refresh_token') {
        this.refreshToken = refreshToken;
        this.scope = scope;
        this.expirationTime = expirationTime;
        this.grantType = grantType;
        this.queryParams = {};
    }
    getPayload() {
        return {
            refresh_token: this.refreshToken,
            scope: this.scope,
            expiration_time: this.expirationTime,
            grant_type: this.grantType,
        };
    }
    getMethod() {
        return constants_1.HttpMethod.POST;
    }
    getUrl() {
        return '/oauth2/token';
    }
    getAuthMethod() {
        return constants_2.HttpAuthType.BASIC;
    }
    getContentType() {
        return 'application/x-www-form-urlencoded';
    }
    getQueryParams() {
        return this.queryParams;
    }
    getUriParams() {
        return null;
    }
}
exports.RefreshTokenPost = RefreshTokenPost;
