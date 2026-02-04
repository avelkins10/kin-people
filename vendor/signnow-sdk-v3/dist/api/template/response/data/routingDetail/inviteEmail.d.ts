import { Reminder } from './reminder';
export interface InviteEmail {
    email: string;
    subject: string;
    message: string;
    expiration_days: number;
    has_sign_actions: boolean;
    reminder?: Reminder;
}
