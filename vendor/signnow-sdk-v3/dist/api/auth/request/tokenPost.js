"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenPost = void 0;
const constants_1 = require("../../../core/constants");
const constants_2 = require("../../../core/constants");
class TokenPost {
    constructor(username, password, grantType, scope = '*', code = '') {
        this.username = username;
        this.password = password;
        this.grantType = grantType;
        this.scope = scope;
        this.code = code;
        this.queryParams = {};
    }
    getPayload() {
        return {
            username: this.username,
            password: this.password,
            grant_type: this.grantType,
            scope: this.scope,
            code: this.code,
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
exports.TokenPost = TokenPost;
