import { Invite } from './data/invite';
export interface PendingInviteGet {
    invites: Invite[];
    document_group_name: string;
    sign_as_merged: boolean;
    owner_organization_id?: string | null;
}
