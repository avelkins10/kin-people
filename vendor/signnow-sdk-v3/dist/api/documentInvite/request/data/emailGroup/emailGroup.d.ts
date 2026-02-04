import { Email } from './email';
export interface EmailGroup {
    id: string;
    name: string;
    emails: Email[];
}
