import { Thumbnail } from './thumbnail';
export interface Template {
    roles: string[];
    template_name: string;
    id: string;
    owner_email: string;
    thumbnail: Thumbnail;
    readable?: boolean | null;
}
