import { Thumbnail } from './thumbnail';
export interface Document {
    id: string;
    roles: string[];
    document_name: string;
    thumbnail: Thumbnail;
    origin_document_id?: string | null;
    has_unassigned_field?: boolean;
    has_credit_card_number?: boolean;
}
