"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SignNowApiException = void 0;
class SignNowApiException extends Error {
    constructor(message, response) {
        super(message);
        this.response = response;
        this.name = 'SignNowApiException';
    }
    getResponse() {
        return this.response;
    }
}
exports.SignNowApiException = SignNowApiException;
