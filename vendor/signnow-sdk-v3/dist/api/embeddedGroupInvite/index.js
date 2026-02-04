"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GroupInvitePostRequest = exports.GroupInviteLinkPostRequest = exports.GroupInviteDeleteRequest = void 0;
var groupInviteDelete_1 = require("./request/groupInviteDelete");
Object.defineProperty(exports, "GroupInviteDeleteRequest", { enumerable: true, get: function () { return groupInviteDelete_1.GroupInviteDelete; } });
var groupInviteLinkPost_1 = require("./request/groupInviteLinkPost");
Object.defineProperty(exports, "GroupInviteLinkPostRequest", { enumerable: true, get: function () { return groupInviteLinkPost_1.GroupInviteLinkPost; } });
var groupInvitePost_1 = require("./request/groupInvitePost");
Object.defineProperty(exports, "GroupInvitePostRequest", { enumerable: true, get: function () { return groupInvitePost_1.GroupInvitePost; } });
