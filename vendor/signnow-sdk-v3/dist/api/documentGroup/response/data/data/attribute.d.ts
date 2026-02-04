import { Reminder } from './reminder';
import { Authentication } from './authentication';
export interface Attribute {
    allow_forwarding: boolean;
    show_decline_button: boolean;
    i_am_recipient: boolean;
    message?: string;
    subject?: string;
    expiration_days?: number | null;
    reminder?: Reminder;
    authentication?: Authentication;
}
