import { RoutingDetail } from './data/routingDetail';
import { CcStep } from './data/ccStep';
import { Viewer } from './data/viewer';
import { Approver } from './data/approver';
import { Attribute } from './data/attribute';
export interface RoutingDetailsGet {
    routing_details: RoutingDetail[];
    cc: string[];
    cc_step: CcStep[];
    viewers: Viewer[];
    approvers: Approver[];
    attributes: Attribute;
    invite_link_instructions?: string[];
}
