import { Data } from './data';
export interface RoutingDetail {
    id: string;
    created: string;
    updated: string;
    data?: Data | null;
    invite_link_instructions?: string | null;
}
