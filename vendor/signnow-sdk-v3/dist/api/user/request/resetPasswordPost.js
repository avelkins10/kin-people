"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResetPasswordPost = void 0;
const constants_1 = require("../../../core/constants");
const constants_2 = require("../../../core/constants");
class ResetPasswordPost {
    constructor(email) {
        this.email = email;
        this.queryParams = {};
    }
    getPayload() {
        return {
            email: this.email,
        };
    }
    getMethod() {
        return constants_1.HttpMethod.POST;
    }
    getUrl() {
        return '/user/forgotpassword';
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
exports.ResetPasswordPost = ResetPasswordPost;
