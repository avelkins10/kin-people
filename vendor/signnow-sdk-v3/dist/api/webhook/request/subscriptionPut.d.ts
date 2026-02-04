import { BaseClass } from '../../../types/baseClass';
import { Attribute } from './data/attribute';
export declare class SubscriptionPut implements BaseClass {
    private eventSubscriptionId;
    private event;
    private entityId;
    private action;
    private attributes;
    private queryParams;
    constructor(eventSubscriptionId: string, event: string, entityId: string, action: string, attributes: Attribute);
    getPayload(): Record<string, string | object>;
    getMethod(): string;
    getUrl(): string;
    getAuthMethod(): string;
    getContentType(): string;
    getQueryParams(): Record<string, string>;
    getUriParams(): {
        event_subscription_id: string;
    };
}
