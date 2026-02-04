import { BaseClass } from '../../../types/baseClass';
import { RoutingDetail } from './data/routingDetail/routingDetail';
export declare class GroupTemplatePut implements BaseClass {
    private templateId;
    private routingDetails;
    private templateGroupName;
    private templateIdsToAdd;
    private templateIdsToRemove;
    private queryParams;
    constructor(templateId: string, routingDetails: RoutingDetail, templateGroupName: string, templateIdsToAdd?: string[], templateIdsToRemove?: string[]);
    getPayload(): Record<string, string | string[] | object>;
    getMethod(): string;
    getUrl(): string;
    getAuthMethod(): string;
    getContentType(): string;
    getQueryParams(): Record<string, string>;
    getUriParams(): {
        template_id: string;
    };
}
