import { Folder } from './data/folder';
import { Document } from './data/document/document';
export interface FolderDocumentsGet {
    id: string;
    created: string;
    name: string;
    user_id: string;
    system_folder: boolean;
    shared: boolean;
    folders: Folder[];
    total_documents: number;
    documents: Document[];
    parent_id?: string | null;
}
