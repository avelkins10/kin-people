import { EmailGroup } from './emailGroup';
export interface InviteEmail {
    email: string;
    subject: string;
    message: string;
    email_group?: EmailGroup;
    expiration_days?: number;
    reminder?: number;
}
