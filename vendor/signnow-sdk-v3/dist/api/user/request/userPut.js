"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserPut = void 0;
const constants_1 = require("../../../core/constants");
const constants_2 = require("../../../core/constants");
class UserPut {
    constructor(firstName, lastName, password = '', oldPassword = '', logoutAll = '') {
        this.firstName = firstName;
        this.lastName = lastName;
        this.password = password;
        this.oldPassword = oldPassword;
        this.logoutAll = logoutAll;
        this.queryParams = {};
    }
    getPayload() {
        return {
            first_name: this.firstName,
            last_name: this.lastName,
            password: this.password,
            old_password: this.oldPassword,
            logout_all: this.logoutAll,
        };
    }
    getMethod() {
        return constants_1.HttpMethod.PUT;
    }
    getUrl() {
        return '/user';
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
exports.UserPut = UserPut;
