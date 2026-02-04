"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InitialPut = void 0;
const constants_1 = require("../../../core/constants");
const constants_2 = require("../../../core/constants");
class InitialPut {
    constructor(data) {
        this.data = data;
        this.queryParams = {};
    }
    getPayload() {
        return {
            data: this.data,
        };
    }
    getMethod() {
        return constants_1.HttpMethod.PUT;
    }
    getUrl() {
        return '/user/initial';
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
exports.InitialPut = InitialPut;
