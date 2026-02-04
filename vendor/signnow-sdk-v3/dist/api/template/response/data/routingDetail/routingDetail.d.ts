import { InviteStep } from './inviteStep';
export interface RoutingDetail {
    sign_as_merged: boolean;
    invite_steps: InviteStep[];
    include_email_attachments?: string | null;
}
