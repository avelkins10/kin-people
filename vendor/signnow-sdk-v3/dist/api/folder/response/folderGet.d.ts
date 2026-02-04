import { Folder } from './data/folder';
import { Document } from './data/document/document';
export interface FolderGet {
    id: string;
    created: number;
    name: string;
    user_id: string;
    system_folder: boolean;
    shared: boolean;
    folders: Folder[];
    total_documents: number;
    documents: Document[];
    parent_id?: string | null;
    team_name?: string | null;
    team_id?: string | null;
    team_type?: string | null;
}
