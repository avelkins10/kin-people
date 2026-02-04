import { BaseClass } from '../../../types/baseClass';
import { Attribute } from './data/attribute';
export declare class SubscriptionPost implements BaseClass {
    private event;
    private entityId;
    private action;
    private attributes;
    private secretKey;
    private queryParams;
    constructor(event: string, entityId: string, action?: string, attributes?: Attribute, secretKey?: string);
    getPayload(): Record<string, string | object>;
    getMethod(): string;
    getUrl(): string;
    getAuthMethod(): string;
    getContentType(): string;
    getQueryParams(): Record<string, string>;
    getUriParams(): null;
}
