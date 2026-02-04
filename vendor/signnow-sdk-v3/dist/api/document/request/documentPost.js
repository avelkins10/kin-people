"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentPost = void 0;
const constants_1 = require("../../../core/constants");
const constants_2 = require("../../../core/constants");
class DocumentPost {
    constructor(file, name = '', checkFields = false, saveFields = 0, makeTemplate = 0, password = null, folderId = null, originTemplateId = null, clientTimestamp = 0) {
        this.file = file;
        this.name = name;
        this.checkFields = checkFields;
        this.saveFields = saveFields;
        this.makeTemplate = makeTemplate;
        this.password = password;
        this.folderId = folderId;
        this.originTemplateId = originTemplateId;
        this.clientTimestamp = clientTimestamp;
        this.queryParams = {};
    }
    getPayload() {
        return {
            file: this.file,
            name: this.name,
            check_fields: this.checkFields,
            save_fields: this.saveFields,
            make_template: this.makeTemplate,
            password: this.password,
            folder_id: this.folderId,
            origin_template_id: this.originTemplateId,
            client_timestamp: this.clientTimestamp,
        };
    }
    getMethod() {
        return constants_1.HttpMethod.POST;
    }
    getUrl() {
        return '/document';
    }
    getAuthMethod() {
        return constants_2.HttpAuthType.BEARER;
    }
    getContentType() {
        return 'multipart/form-data';
    }
    getQueryParams() {
        return this.queryParams;
    }
    getUriParams() {
        return null;
    }
}
exports.DocumentPost = DocumentPost;
