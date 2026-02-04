export interface Approver {
    name: string;
    signing_order: number;
    default_email?: string;
    inviter_role?: boolean;
}
