import { BaseClass } from '../../../types/baseClass';
import { To } from './data/to/to';
import { EmailGroup } from './data/emailGroup/emailGroup';
import { CcStep } from './data/ccStep';
import { Viewer } from './data/viewer';
export declare class SendInvitePost implements BaseClass {
    private documentId;
    private to;
    private from;
    private subject;
    private message;
    private emailGroups;
    private cc;
    private ccStep;
    private viewers;
    private ccSubject;
    private ccMessage;
    private queryParams;
    constructor(documentId: string, to: To[], from: string, subject: string, message: string, emailGroups?: EmailGroup[], cc?: string[], ccStep?: CcStep[], viewers?: Viewer[], ccSubject?: string, ccMessage?: string);
    getPayload(): Record<string, string | To[] | EmailGroup[] | string[] | CcStep[] | Viewer[]>;
    getMethod(): string;
    getUrl(): string;
    getAuthMethod(): string;
    getContentType(): string;
    getQueryParams(): Record<string, string>;
    getUriParams(): {
        document_id: string;
    };
}
