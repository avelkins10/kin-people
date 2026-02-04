import { EmailGroup } from './emailGroup';
import { Attribute } from './attribute';
import { Document } from './document';
export interface Recipient {
    name: string;
    email: string | null;
    order: number;
    documents: Document[];
    email_group?: EmailGroup;
    attributes?: Attribute;
}
