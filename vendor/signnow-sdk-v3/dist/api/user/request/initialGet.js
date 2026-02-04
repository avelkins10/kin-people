"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InitialGet = void 0;
const constants_1 = require("../../../core/constants");
const constants_2 = require("../../../core/constants");
class InitialGet {
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
exports.InitialGet = InitialGet;
