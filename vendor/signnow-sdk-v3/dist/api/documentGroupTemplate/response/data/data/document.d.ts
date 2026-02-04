import { Thumbnail } from './thumbnail';
export interface Document {
    roles: string[];
    document_name: string;
    id: string;
    thumbnail: Thumbnail;
    origin_document_id: string;
    has_unassigned_field: boolean;
    has_credit_card_number: boolean;
}
