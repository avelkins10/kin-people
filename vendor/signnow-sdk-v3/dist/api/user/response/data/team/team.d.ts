import { Admin } from './admin';
export interface Team {
    id: string;
    team: string;
    type: string;
    created_since: string;
    role: string;
    document_count: number;
    admins: Admin[];
    workspace_id?: string | null;
}
