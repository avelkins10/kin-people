import { RoutingDetail } from './data/routingDetail';
import { CcStep } from './data/ccStep';
import { Viewer } from './data/viewer';
import { Approver } from './data/approver';
export interface RoutingDetailsPost {
    routing_details: RoutingDetail[];
    cc?: string[];
    cc_step?: CcStep[];
    viewers?: Viewer[];
    approvers?: Approver[];
    invite_link_instructions?: string[];
}
