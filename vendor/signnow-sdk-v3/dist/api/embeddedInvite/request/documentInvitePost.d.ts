import { BaseClass } from '../../../types/baseClass';
import { Invite } from './data/invite';
export declare class DocumentInvitePost implements BaseClass {
    private documentId;
    private invites;
    private nameFormula;
    private queryParams;
    constructor(documentId: string, invites: Invite[], nameFormula?: string);
    getPayload(): Record<string, string | Invite[]>;
    getMethod(): string;
    getUrl(): string;
    getAuthMethod(): string;
    getContentType(): string;
    getQueryParams(): Record<string, string>;
    getUriParams(): {
        document_id: string;
    };
}
