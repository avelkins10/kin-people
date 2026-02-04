import { InviteEmail } from './inviteEmail';
import { InviteAction } from './inviteAction';
export interface InviteStep {
    order: number;
    invite_actions: InviteAction[];
    invite_emails?: InviteEmail[];
}
