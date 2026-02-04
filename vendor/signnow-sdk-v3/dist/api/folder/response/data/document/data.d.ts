import { Reminder } from './reminder';
export interface Data {
    name?: string | null;
    inviter_role?: boolean | null;
    signing_order?: number | null;
    delivery_type?: string | null;
    default_email?: string | null;
    role_id?: string | null;
    decline_by_signature?: boolean | null;
    reassign?: boolean | null;
    expiration_days?: number | null;
    reminder?: Reminder | null;
}
