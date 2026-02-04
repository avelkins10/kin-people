"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Sdk = void 0;
const apiClient_1 = require("./apiClient");
const config_1 = require("./config/config");
const tokenPost_1 = require("../api/auth/request/tokenPost");
class Sdk {
    constructor() {
        this.API_VERSION = '2024-11-27';
        this.GRANT_TYPE_PASSWORD = 'password';
        this.apiClient = new apiClient_1.ApiClient();
        this.config = new config_1.Config();
    }
    async authenticate(username = this.config.getApiUsername(), password = this.config.getApiPassword()) {
        const request = new tokenPost_1.TokenPost(username, password, this.GRANT_TYPE_PASSWORD);
        const response = await this.apiClient.send(request);
        this.apiClient.setBearerToken(response.access_token);
        return this;
    }
    version() {
        return this.API_VERSION;
    }
    getClient() {
        return this.apiClient;
    }
    actualBearerToken() {
        return this.apiClient.getBearerToken();
    }
    setBearerToken(bearerToken) {
        this.apiClient.setBearerToken(bearerToken);
        return this;
    }
}
exports.Sdk = Sdk;
