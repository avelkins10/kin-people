import { Storage } from './storage';
export interface ExportedTo {
    export_domain: string;
    is_exported: boolean;
    exported_user_ids: string[];
    storages?: Storage[];
}
