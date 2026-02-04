"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailVerifyPut = void 0;
const constants_1 = require("../../../core/constants");
const constants_2 = require("../../../core/constants");
class EmailVerifyPut {
    constructor(email, verificationToken) {
        this.email = email;
        this.verificationToken = verificationToken;
        this.queryParams = {};
    }
    getPayload() {
        return {
            email: this.email,
            verification_token: this.verificationToken,
        };
    }
    getMethod() {
        return constants_1.HttpMethod.PUT;
    }
    getUrl() {
        return '/user/email/verify';
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
exports.EmailVerifyPut = EmailVerifyPut;
