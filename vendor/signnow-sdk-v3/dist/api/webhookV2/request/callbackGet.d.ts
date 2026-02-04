import { BaseClass } from '../../../types/baseClass';
export declare class CallbackGet implements BaseClass {
    private eventSubscriptionId;
    private callbackId;
    private queryParams;
    constructor(eventSubscriptionId: string, callbackId: string);
    getPayload(): Record<string, string>;
    getMethod(): string;
    getUrl(): string;
    getAuthMethod(): string;
    getContentType(): string;
    getQueryParams(): Record<string, string>;
    getUriParams(): {
        event_subscription_id: string;
        callback_id: string;
    };
}
