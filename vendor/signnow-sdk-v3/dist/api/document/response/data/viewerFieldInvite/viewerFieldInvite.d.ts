import { EmailGroup } from './emailGroup';
import { EmailStatus } from './emailStatus';
export interface ViewerFieldInvite {
    id: string;
    status: string;
    created: string;
    updated: string;
    email: string;
    redirect_target: string;
    email_group: EmailGroup;
    email_statuses: EmailStatus[];
    signer_user_id?: string | null;
    role?: string | null;
    role_id?: string | null;
    close_redirect_uri?: string | null;
}
