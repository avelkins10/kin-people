import { BaseClass } from '../../../types/baseClass';
export declare class CallbacksAllGet implements BaseClass {
    private eventSubscriptionId;
    private queryParams;
    constructor(eventSubscriptionId: string);
    getPayload(): Record<string, string>;
    getMethod(): string;
    getUrl(): string;
    getAuthMethod(): string;
    getContentType(): string;
    getQueryParams(): Record<string, string>;
    getUriParams(): {
        event_subscription_id: string;
    };
}
