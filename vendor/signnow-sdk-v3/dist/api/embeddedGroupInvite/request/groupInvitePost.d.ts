import { BaseClass } from '../../../types/baseClass';
import { Invite } from './data/invite/invite';
export declare class GroupInvitePost implements BaseClass {
    private documentGroupId;
    private invites;
    private signAsMerged;
    private queryParams;
    constructor(documentGroupId: string, invites: Invite[], signAsMerged: boolean);
    getPayload(): Record<string, string | Invite[] | boolean>;
    getMethod(): string;
    getUrl(): string;
    getAuthMethod(): string;
    getContentType(): string;
    getQueryParams(): Record<string, string>;
    getUriParams(): {
        document_group_id: string;
    };
}
