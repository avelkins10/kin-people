"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpAuthType = exports.HttpMethod = exports.HttpStatusCode = void 0;
var HttpStatusCode;
(function (HttpStatusCode) {
    HttpStatusCode[HttpStatusCode["REDIRECT"] = 300] = "REDIRECT";
    HttpStatusCode[HttpStatusCode["CLIENT_ERROR"] = 400] = "CLIENT_ERROR";
    HttpStatusCode[HttpStatusCode["SERVER_ERROR"] = 500] = "SERVER_ERROR";
})(HttpStatusCode || (exports.HttpStatusCode = HttpStatusCode = {}));
var HttpMethod;
(function (HttpMethod) {
    HttpMethod["PUT"] = "put";
    HttpMethod["GET"] = "get";
    HttpMethod["POST"] = "post";
    HttpMethod["DELETE"] = "delete";
    HttpMethod["PATCH"] = "patch";
})(HttpMethod || (exports.HttpMethod = HttpMethod = {}));
var HttpAuthType;
(function (HttpAuthType) {
    HttpAuthType["BEARER"] = "bearer";
    HttpAuthType["BASIC"] = "basic";
})(HttpAuthType || (exports.HttpAuthType = HttpAuthType = {}));
