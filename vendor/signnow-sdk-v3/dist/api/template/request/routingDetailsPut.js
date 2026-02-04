"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoutingDetailsPut = void 0;
const constants_1 = require("../../../core/constants");
const constants_2 = require("../../../core/constants");
class RoutingDetailsPut {
    constructor(documentId, templateData = [], templateDataObject = [], cc = [], ccStep = [], viewers = [], approvers = [], inviteLinkInstructions = []) {
        this.documentId = documentId;
        this.templateData = templateData;
        this.templateDataObject = templateDataObject;
        this.cc = cc;
        this.ccStep = ccStep;
        this.viewers = viewers;
        this.approvers = approvers;
        this.inviteLinkInstructions = inviteLinkInstructions;
        this.queryParams = {};
    }
    getPayload() {
        return {
            document_id: this.documentId,
            template_data: this.templateData,
            template_data_object: this.templateDataObject,
            cc: this.cc,
            cc_step: this.ccStep,
            viewers: this.viewers,
            approvers: this.approvers,
            invite_link_instructions: this.inviteLinkInstructions,
        };
    }
    getMethod() {
        return constants_1.HttpMethod.PUT;
    }
    getUrl() {
        return '/document/{document_id}/template/routing/detail';
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
            document_id: this.documentId,
        };
    }
}
exports.RoutingDetailsPut = RoutingDetailsPut;
