"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentGroupTemplatePost = void 0;
const constants_1 = require("../../../core/constants");
const constants_2 = require("../../../core/constants");
class DocumentGroupTemplatePost {
    constructor(templateGroupId, groupName, clientTimestamp = null, folderId = null) {
        this.templateGroupId = templateGroupId;
        this.groupName = groupName;
        this.clientTimestamp = clientTimestamp;
        this.folderId = folderId;
        this.queryParams = {};
    }
    getPayload() {
        return {
            template_group_id: this.templateGroupId,
            group_name: this.groupName,
            client_timestamp: this.clientTimestamp,
            folder_id: this.folderId,
        };
    }
    getMethod() {
        return constants_1.HttpMethod.POST;
    }
    getUrl() {
        return '/v2/document-group-templates/{template_group_id}/document-group';
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
            template_group_id: this.templateGroupId,
        };
    }
}
exports.DocumentGroupTemplatePost = DocumentGroupTemplatePost;
