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
exports.Sdk = exports.webhookV2 = exports.webhook = exports.user = exports.template = exports.smartFields = exports.folder = exports.embeddedSending = exports.embeddedInvite = exports.embeddedGroupInvite = exports.embeddedEditor = exports.documentInvite = exports.documentGroupInvite = exports.documentGroup = exports.documentField = exports.document = exports.auth = void 0;
exports.auth = __importStar(require("./api/auth"));
exports.document = __importStar(require("./api/document"));
exports.documentField = __importStar(require("./api/documentField"));
exports.documentGroup = __importStar(require("./api/documentGroup"));
exports.documentGroupInvite = __importStar(require("./api/documentGroupInvite"));
exports.documentInvite = __importStar(require("./api/documentInvite"));
exports.embeddedEditor = __importStar(require("./api/embeddedEditor"));
exports.embeddedGroupInvite = __importStar(require("./api/embeddedGroupInvite"));
exports.embeddedInvite = __importStar(require("./api/embeddedInvite"));
exports.embeddedSending = __importStar(require("./api/embeddedSending"));
exports.folder = __importStar(require("./api/folder"));
exports.smartFields = __importStar(require("./api/smartFields"));
exports.template = __importStar(require("./api/template"));
exports.user = __importStar(require("./api/user"));
exports.webhook = __importStar(require("./api/webhook"));
exports.webhookV2 = __importStar(require("./api/webhookV2"));
var sdk_1 = require("./core/sdk");
Object.defineProperty(exports, "Sdk", { enumerable: true, get: function () { return sdk_1.Sdk; } });
