import { BaseClass } from '../../../types/baseClass';
import { InviteEmail } from './data/inviteEmail';
import { UpdateInviteActionAttribute } from './data/updateInviteActionAttribute';
export declare class ReassignSignerPost implements BaseClass {
    private documentGroupId;
    private inviteId;
    private stepId;
    private userToUpdate;
    private replaceWithThisUser;
    private inviteEmail;
    private updateInviteActionAttributes;
    private queryParams;
    constructor(documentGroupId: string, inviteId: string, stepId: string, userToUpdate: string, replaceWithThisUser?: string, inviteEmail?: InviteEmail, updateInviteActionAttributes?: UpdateInviteActionAttribute[]);
    getPayload(): Record<string, string | object | UpdateInviteActionAttribute[]>;
    getMethod(): string;
    getUrl(): string;
    getAuthMethod(): string;
    getContentType(): string;
    getQueryParams(): Record<string, string>;
    getUriParams(): {
        document_group_id: string;
        invite_id: string;
        step_id: string;
    };
}
