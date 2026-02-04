import { Document } from './data/document/document';
import { OriginatorOrganizationSettings } from './data/originatorOrganizationSettings';
export interface DocumentGroupGet {
    id: string;
    group_name: string;
    documents: Document[];
    originator_organization_settings: OriginatorOrganizationSettings[];
    invite_id?: string | null;
}
