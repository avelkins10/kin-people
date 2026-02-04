import { BaseClass } from '../../../types/baseClass';
import { TemplateData } from './data/templateData';
import { TemplateDataObject } from './data/templateDataObject';
import { CcStep } from './data/ccStep';
import { Viewer } from './data/viewer';
import { Approver } from './data/approver';
export declare class RoutingDetailsPut implements BaseClass {
    private documentId;
    private templateData;
    private templateDataObject;
    private cc;
    private ccStep;
    private viewers;
    private approvers;
    private inviteLinkInstructions;
    private queryParams;
    constructor(documentId: string, templateData?: TemplateData[] | null, templateDataObject?: TemplateDataObject[] | null, cc?: string[] | null, ccStep?: CcStep[] | null, viewers?: Viewer[] | null, approvers?: Approver[] | null, inviteLinkInstructions?: string[] | null);
    getPayload(): Record<string, string | object | TemplateDataObject[] | null | string[] | CcStep[] | Viewer[] | Approver[]>;
    getMethod(): string;
    getUrl(): string;
    getAuthMethod(): string;
    getContentType(): string;
    getQueryParams(): Record<string, string>;
    getUriParams(): {
        document_id: string;
    };
}
