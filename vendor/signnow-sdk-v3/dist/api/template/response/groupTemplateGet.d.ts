import { RoutingDetail } from './data/routingDetail/routingDetail';
import { Template } from './data/template/template';
import { ShareInfo } from './data/shareInfo';
export interface GroupTemplateGet {
    id: string;
    user_id: string;
    group_name: string;
    folder_id: string;
    routing_details: RoutingDetail;
    templates: Template[];
    shared: number;
    document_group_template_owner_email: string;
    shared_team_id: string | null;
    own_as_merged: boolean;
    email_action_on_complete: string | null;
    created: number;
    updated: number;
    recently_used: number;
    pinned: boolean;
    share_info?: ShareInfo | null;
}
