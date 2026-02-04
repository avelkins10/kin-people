import { BaseClass } from '../../../types/baseClass';
import { InviteStep } from './data/inviteStep/inviteStep';
import { EmailGroup } from './data/emailGroup/emailGroup';
import { CompletionEmail } from './data/completionEmail';
export declare class GroupInvitePost implements BaseClass {
    private documentGroupId;
    private inviteSteps;
    private cc;
    private emailGroups;
    private completionEmails;
    private signAsMerged;
    private clientTimestamp;
    private ccSubject;
    private ccMessage;
    private queryParams;
    constructor(documentGroupId: string, inviteSteps: InviteStep[], cc: string[], emailGroups?: EmailGroup[], completionEmails?: CompletionEmail[], signAsMerged?: boolean, clientTimestamp?: number, ccSubject?: string, ccMessage?: string);
    getPayload(): Record<string, string | InviteStep[] | EmailGroup[] | CompletionEmail[] | boolean | number | string[]>;
    getMethod(): string;
    getUrl(): string;
    getAuthMethod(): string;
    getContentType(): string;
    getQueryParams(): Record<string, string>;
    getUriParams(): {
        document_group_id: string;
    };
}
