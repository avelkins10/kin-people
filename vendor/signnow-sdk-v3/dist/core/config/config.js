"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Config = void 0;
const dotenv = __importStar(require("dotenv"));
const DEFAULT_DOWNLOADS_DIR = './storage/downloads';
const CLIENT_NAME = 'SignNowApiClient/v3.0.0 (JS)';
dotenv.config();
class Config {
    constructor(SIGNNOW_API_HOST = process.env.SIGNNOW_API_HOST || '', SIGNNOW_API_BASIC_TOKEN = process.env.SIGNNOW_API_BASIC_TOKEN || '', SIGNNOW_API_USERNAME = process.env.SIGNNOW_API_USERNAME || '', SIGNNOW_API_PASSWORD = process.env.SIGNNOW_API_PASSWORD || '', SIGNNOW_DOWNLOADS_DIR = process.env.SIGNNOW_DOWNLOADS_DIR || '') {
        this.SIGNNOW_API_HOST = SIGNNOW_API_HOST;
        this.SIGNNOW_API_BASIC_TOKEN = SIGNNOW_API_BASIC_TOKEN;
        this.SIGNNOW_API_USERNAME = SIGNNOW_API_USERNAME;
        this.SIGNNOW_API_PASSWORD = SIGNNOW_API_PASSWORD;
        this.SIGNNOW_DOWNLOADS_DIR = SIGNNOW_DOWNLOADS_DIR;
    }
    getApiHost() {
        return this.SIGNNOW_API_HOST;
    }
    getApiBasicToken() {
        return this.SIGNNOW_API_BASIC_TOKEN;
    }
    getApiUsername() {
        return this.SIGNNOW_API_USERNAME;
    }
    getApiPassword() {
        return this.SIGNNOW_API_PASSWORD;
    }
    getDownloadDirectory() {
        return this.SIGNNOW_DOWNLOADS_DIR || DEFAULT_DOWNLOADS_DIR;
    }
    getClientName() {
        return CLIENT_NAME;
    }
}
exports.Config = Config;
