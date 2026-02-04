export interface RoutingDetail {
    name: string;
    role_id: string;
    default_email: string;
    inviter_role: boolean;
    signing_order: number;
    decline_by_signature?: boolean;
    delivery_type?: string | null;
}
