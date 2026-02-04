"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GroupTemplatePut = void 0;
const constants_1 = require("../../../core/constants");
const constants_2 = require("../../../core/constants");
class GroupTemplatePut {
    constructor(templateId, routingDetails, templateGroupName, templateIdsToAdd = [], templateIdsToRemove = []) {
        this.templateId = templateId;
        this.routingDetails = routingDetails;
        this.templateGroupName = templateGroupName;
        this.templateIdsToAdd = templateIdsToAdd;
        this.templateIdsToRemove = templateIdsToRemove;
        this.queryParams = {};
    }
    getPayload() {
        return {
            template_id: this.templateId,
            template_ids_to_add: this.templateIdsToAdd,
            template_ids_to_remove: this.templateIdsToRemove,
            routing_details: this.routingDetails,
            template_group_name: this.templateGroupName,
        };
    }
    getMethod() {
        return constants_1.HttpMethod.PUT;
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
exports.GroupTemplatePut = GroupTemplatePut;
