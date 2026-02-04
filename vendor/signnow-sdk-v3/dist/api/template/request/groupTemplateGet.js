"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GroupTemplateGet = void 0;
const constants_1 = require("../../../core/constants");
const constants_2 = require("../../../core/constants");
class GroupTemplateGet {
    constructor(templateId) {
        this.templateId = templateId;
        this.queryParams = {};
    }
    getPayload() {
        return {
            template_id: this.templateId,
        };
    }
    getMethod() {
        return constants_1.HttpMethod.GET;
    }
    getUrl() {
        return '/documentgroup/template/{template_id}';
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
        return {
            template_id: this.templateId,
        };
    }
}
exports.GroupTemplateGet = GroupTemplateGet;
