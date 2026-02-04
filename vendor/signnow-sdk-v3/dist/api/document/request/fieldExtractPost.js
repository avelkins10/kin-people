"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FieldExtractPost = void 0;
const constants_1 = require("../../../core/constants");
const constants_2 = require("../../../core/constants");
class FieldExtractPost {
    constructor(file, tags = [], parseType = 'default', password = null, clientTimestamp = 0) {
        this.file = file;
        this.tags = tags;
        this.parseType = parseType;
        this.password = password;
        this.clientTimestamp = clientTimestamp;
        this.queryParams = {};
    }
    getPayload() {
        return {
            file: this.file,
            tags: this.tags,
            parse_type: this.parseType,
            password: this.password,
            client_timestamp: this.clientTimestamp,
        };
    }
    getMethod() {
        return constants_1.HttpMethod.POST;
    }
    getUrl() {
        return '/document/fieldextract';
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
exports.FieldExtractPost = FieldExtractPost;
