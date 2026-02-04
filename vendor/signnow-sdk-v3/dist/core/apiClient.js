"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiClient = void 0;
const fs_1 = __importDefault(require("fs"));
const node_fetch_1 = __importDefault(require("node-fetch"));
const form_data_1 = __importDefault(require("form-data"));
const config_1 = require("./config/config");
const fileDownloader_1 = require("./response/fileDownloader");
const constants_1 = require("./constants");
const signNowApiException_1 = require("./error/signNowApiException");
class ApiClient {
    constructor(bearerToken, headers) {
        this.bearerToken = bearerToken;
        this.headers = headers;
        this.config = new config_1.Config();
        this.fileDownloader = new fileDownloader_1.FileDownloader(this.config);
    }
    setBearerToken(bearerToken) {
        this.bearerToken = bearerToken;
    }
    getBearerToken() {
        return this.bearerToken;
    }
    async send(request) {
        return this.makeRequest(request.getMethod(), this.buildUri(request), this.getHeaders(request), this.getBody(request));
    }
    async makeRequest(method, url, headers, body) {
        const apiUrl = `${this.config.getApiHost()}${url}`;
        const response = await (0, node_fetch_1.default)(apiUrl, { method, headers, body });
        this.validateResponse(response);
        const contentType = response.headers.get('content-type') || '';
        if (contentType && this.isFileContentType(contentType)) {
            const filePath = await this.fileDownloader.downloadFile(response);
            return filePath;
        }
        if (this.isSuccessWithNoContent(response.status)) {
            return {};
        }
        return response.json();
    }
    isSuccessWithNoContent(status) {
        return status === 201 || status === 204;
    }
    validateResponse(response) {
        const responseStatus = response.status;
        switch (true) {
            case responseStatus >= constants_1.HttpStatusCode.REDIRECT && responseStatus < constants_1.HttpStatusCode.CLIENT_ERROR:
                throw new signNowApiException_1.SignNowApiException('SignNow API call was redirected.', response);
            case responseStatus >= constants_1.HttpStatusCode.CLIENT_ERROR && responseStatus < constants_1.HttpStatusCode.SERVER_ERROR:
                throw new signNowApiException_1.SignNowApiException('SignNow API call was invalid.', response);
            case responseStatus >= constants_1.HttpStatusCode.SERVER_ERROR:
                throw new signNowApiException_1.SignNowApiException('SignNow API call has failed due to server error.', response);
        }
    }
    buildUri(request) {
        let uri = request.getUrl();
        const params = request.getUriParams();
        const queryParams = request.getQueryParams();
        if (params === null) {
            return uri;
        }
        for (const [paramName, paramValue] of Object.entries(params)) {
            uri = uri.replace(`{${paramName}}`, paramValue);
        }
        if (queryParams && Object.keys(queryParams).length > 0) {
            uri = this.appendQueryParams(uri, queryParams);
        }
        return uri;
    }
    getHeaders(request) {
        const isBasicAuth = request.getAuthMethod() === 'basic';
        const contentType = request.getContentType();
        const authValue = isBasicAuth
            ? `Basic ${this.config.getApiBasicToken()}`
            : `Bearer ${this.bearerToken}`;
        const headers = {
            ...this.headers,
            Accept: 'application/json',
            Authorization: authValue,
            'User-Agent': this.config.getClientName(),
            'Content-Type': contentType,
        };
        if (contentType === 'multipart/form-data') {
            delete headers['Content-Type'];
        }
        return headers;
    }
    getBody(request) {
        const payload = request.getPayload();
        const method = request.getMethod().toLowerCase();
        if (!payload || !['post', 'put'].includes(method)) {
            return undefined;
        }
        const contentType = request.getContentType();
        const cleanPayload = this.clearPayload(payload);
        switch (contentType) {
            case 'application/x-www-form-urlencoded':
                return this.createUrlEncodedBody(cleanPayload);
            case 'multipart/form-data':
                return this.createMultipartFormBody(cleanPayload);
            default:
                return JSON.stringify(cleanPayload);
        }
    }
    clearPayload(payload) {
        const result = {};
        for (const [key, value] of Object.entries(payload)) {
            if (value === null || value === '') {
                continue;
            }
            if (Array.isArray(value) && value.length === 0) {
                continue;
            }
            result[key] = value;
        }
        return result;
    }
    createUrlEncodedBody(payload) {
        const searchParams = new URLSearchParams();
        for (const [key, value] of Object.entries(payload)) {
            if (value !== undefined && value !== null) {
                searchParams.append(key, String(value));
            }
        }
        return searchParams;
    }
    createMultipartFormBody(payload) {
        const formData = new form_data_1.default();
        for (const [key, value] of Object.entries(payload)) {
            if (value === undefined || value === null) {
                continue;
            }
            if (key === 'file' && typeof value === 'string') {
                formData.append('file', fs_1.default.createReadStream(value));
            }
            else {
                formData.append(key, String(value));
            }
        }
        return formData;
    }
    isFileContentType(contentType) {
        return contentType.includes('application/pdf')
            || contentType.includes('application/zip');
    }
    appendQueryParams(url, params) {
        if (!params || Object.keys(params).length === 0) {
            return url;
        }
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value === null || value === undefined) {
                return;
            }
            if (Array.isArray(value)) {
                value.forEach(item => {
                    searchParams.append(`${key}[]`, String(item));
                });
            }
            else {
                searchParams.append(key, String(value));
            }
        });
        const queryString = searchParams.toString();
        if (!queryString) {
            return url;
        }
        const separator = url.includes('?') ? '&' : '?';
        return `${url}${separator}${queryString}`;
    }
}
exports.ApiClient = ApiClient;
