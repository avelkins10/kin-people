"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserPost = void 0;
const constants_1 = require("../../../core/constants");
const constants_2 = require("../../../core/constants");
class UserPost {
    constructor(email, password, firstName = '', lastName = '', number = '') {
        this.email = email;
        this.password = password;
        this.firstName = firstName;
        this.lastName = lastName;
        this.number = number;
        this.queryParams = {};
    }
    getPayload() {
        return {
            email: this.email,
            password: this.password,
            first_name: this.firstName,
            last_name: this.lastName,
            number: this.number,
        };
    }
    getMethod() {
        return constants_1.HttpMethod.POST;
    }
    getUrl() {
        return '/user';
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
exports.UserPost = UserPost;
